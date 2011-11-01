/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Control/SelectFeature.js
 * @requires OpenLayers/Popup/FramedCloud.js
 */

/**
 * Class: OpenLayers.Control.SmartPopup
 * 
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.SmartPopup = OpenLayers.Class(OpenLayers.Control, {

    /**
     * APIProperty: autoActivate
     * {Boolean} Activate the control when it is added to a map.  Default is
     *     true.
     */
    autoActivate: true,

    /**
     * Property: popup
     */
    popup: null,
    
    /**
     * Property: selectControl
     * {<OpenLayers.Control.SelectFeature>}
     */
    selectControl: null,
    
    /**
     * Property: templates
     * {Object} stores templates of this control's layers.
     */
    templates: null,    
        
    /**
     * Property: layers
     * {Array(<OpenLayers.Layer.Vector>)} The layers this control will work on.
     */
    layers: null,
    
    /**
     * Constructor: OpenLayers.Control.SmartPopup
     */
    initialize: function() {
        OpenLayers.Control.prototype.initialize.apply(this, []);
        this.selectControl = new OpenLayers.Control.SelectFeature([], {
            onSelect: this.selectFeature,
            onUnselect: this.unselectFeature,
            scope: this
        });
        this.templates = {};
        this.layers = [];
    },

    /**
     * APIMethod: destroy
     */
    destroy: function() {
        this.deactivate();
        this.templates = null;
        this.layers = null;
        OpenLayers.Control.prototype.destroy.apply(this, arguments);        
    },
    
    /**
     * APIMethod: activate
     */
    activate: function() {
        if (OpenLayers.Control.prototype.activate.apply(this, arguments)) {
            this.map.addControl(this.selectControl);
            this.selectControl.activate();	
            this.map.events.on({
                scope: this,
                "zoomend": this.onZoomEnd,
                "addlayer": this.onAddLayer,
                "removelayer": this.onRemoveLayer
            });
            for (var i = 0, len = this.map.layers.length; i < len; i++) {
                this.addLayer(this.map.layers[i]);
            }
            return true;
        } else {
            return false;
        }
    },

    /**
     * APIMethod: deactivate
     */
    deactivate: function() {
        if (OpenLayers.Control.prototype.deactivate.apply(this, arguments)) {
            this.map.events.un({
                scope: this,
                "zoomend": this.onZoomEnd,
                "addlayer": this.onAddLayer,
                "removelayer": this.onRemoveLayer
            });
            this.destroyPopup();
            return true;
        } else {
            return false;
        }
    },
    
    /**
     * Method: onAddLayer
     */    
    onAddLayer: function (evt) {
        this.addLayer(evt.layer);
    },
        
    /**
     * Method: onAddLayer
     */    
    onRemoveLayer: function (evt) {
        this.removeLayer(evt.layer);
    },
    
    /**
     * APIMethod: addLayer
     *
     * Parameters:
     * layer - {<OpenLayers.Layer.Vector>} 
     * selectTemplateURI - {String} If the layer has informed the property selectTemplateURI 
     *     this argument is optional.
     * 
     * Returns:
     * {Boolean} True if the layer was successfully added.
     */    
    addLayer: function (layer, selectTemplateURI) {
        var done = false;
        selectTemplateURI = selectTemplateURI || layer.selectTemplateURI;
        if (selectTemplateURI && !this.templates[layer.id] && layer instanceof OpenLayers.Layer.Vector) {
            var response, html;
            response = OpenLayers.Request.GET({url:selectTemplateURI, async:false});
            if (response.responseText) {
                html = response.responseText.replace(
                    /%OpenLayers.i18n\(["']([^%]*)["']\)%/g, 
                    function(a,key){
                        return OpenLayers.i18n(key);
                    }
                );
            } else {
                html = response.status + "-" + response.statusText; // If error loads text error as template
            }
            this.templates[layer.id] = html;
            this.layers.push(layer);
            this.selectControl.setLayer(this.layers);
            done = true;
        }
        return done;
    },
    
    /**
     * APIMethod: removeLayer
     */    
    removeLayer: function () { 
        // TODO
    },
    
    /**
     * Method: selectFeature
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} the selected feature.
     */
    selectFeature: function(feature) {
        var featureAttributes = feature.attributes;
        var html = this.templates[feature.layer.id].replace(
            /%([^%]*)%/g, 
            function(a,name){
                return featureAttributes[name] || "";
            }
        );
        this.popup = new OpenLayers.Popup.FramedCloud(null, 
            feature.geometry.getBounds().getCenterLonLat(), null,
            html,
            null, false, null);
        this.popup.maxSize=new OpenLayers.Size(300,500);
        this.map.addPopup(this.popup);
    },

    /**
     * Method: unselectFeature
     * Called when the select feature control unselects a feature.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} The unselected feature.
     */
    unselectFeature: function(feature) {
        this.destroyPopup();
    },
    
    /**
     * Method: onZoomEnd
     */
    onZoomEnd: function(feature) {
        this.destroyPopup();
    },
    
    /**
     * Method: destroyPopup
     */    
    destroyPopup: function () {
        if (this.popup){
            if (this.map) {
                this.map.removePopup(this.popup);
            }
            this.popup.destroy();
            this.popup = null;
        }
    },

    CLASS_NAME: "OpenLayers.Control.SmartPopup"
});

