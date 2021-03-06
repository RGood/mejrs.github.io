import "../leaflet.js";

export default void function (factory) {
    var L;
    if (typeof define === "function" && define.amd) {
        define(["leaflet"], factory)
    } else if (typeof module !== "undefined") {
        L = require("leaflet");
        module.exports = factory(L)
    } else {
        if (typeof window.L === "undefined") {
            throw new Error("Leaflet must be loaded first")
        }
        factory(window.L)
    }
}
(function (L) {

	
	
    L.Control.Display = L.Control.extend({
            onAdd: function (map) {
                this._map = map;
                this._container = L.DomUtil.create('div', "leaflet-control-layers leaflet-control-display");

                this.collapsed = this.createIcon(this.options.icon);
                L.DomEvent.on(this.collapsed, {
                    click: this.expand,

                }, this);
                this._container.appendChild(this.collapsed);
                this._container.title = this.options.title;
                L.DomEvent.disableClickPropagation(this._container);

                let closeIcon = L.DomUtil.create('a', "leaflet-control-display-icon-close");
                L.DomEvent.on(closeIcon, {
                    click: this.collapse,

                }, this);
                L.DomEvent.disableClickPropagation(closeIcon);

                let expandedContent = this.createInterface();
                let expandedContentContainer = L.DomUtil.create('div', 'leaflet-control-display-container-expanded');
                expandedContentContainer.appendChild(expandedContent)

                this.expanded = L.DomUtil.create('div', "leaflet-control-display");
                this.expanded.appendChild(closeIcon);
                this.expanded.appendChild(expandedContentContainer);

                return this._container;
            },

            // @method expand(): this
            // Expand the control container if collapsed.
            expand: function () {
                this._container.innerHTML = '';
                this._container.append(this.expanded);
                return this;
            },

            // @method collapse(): this
            // Collapse the control container.
            collapse: function () {
                this._container.innerHTML = '';
                this._container.append(this.collapsed);
                return this;
            },

            expanded: undefined,

            // @method createInterface
            // Reimplement .createInterface to set content for the expanded interface;
            // return a HTML Element
            createInterface: function () {
                return L.DomUtil.create('div');
            },

            collapsed: undefined,

            createIcon: function (icon) {
                let container = L.DomUtil.create('div', "leaflet-control-display-collapsed");
                let img = L.DomUtil.create('img', "leaflet-control-display-icon");
                img.src = icon;
                container.append(img);
                return container;
            },

            onRemove: function (map) {
                // Nothing to do here
            },

            setSearchParams: function (parameters) {
                let url = new URL(window.location.href);
                let params = url.searchParams;

                for (let[key, value]of Object.entries(parameters)) {
                    if (value || value === 0) {
                        params.set(key, value);
                    } else {
                        params.delete(key);
                    }
                }
                url.search = params;
                history.replaceState(0, "Location", url);
            },
        });

    L.control.display = function (options) {
        return new L.Control.Display(options);
    }

    L.Control.Display.Objects = L.Control.Display.extend({
            options: {
                expand: true,
                position: 'bottomleft',
                title: 'Display objects',
                icon: '../mejrs.github.io/images/objects.png',
            },

            onAdd: function (map) {
                return L.Control.Display.prototype.onAdd.call(this, map);
            },
            createInterface: function () {
                let parsedUrl = new URL(window.location.href);
                let objectName = parsedUrl.searchParams.get('object') || '';
                let objectId = parsedUrl.searchParams.get('objectid');

                let container = L.DomUtil.create('div', 'leaflet-control-display-expanded');

                let objectForm = L.DomUtil.create('form', 'leaflet-control-display-form', container);

                let nameDescription = L.DomUtil.create('label', 'leaflet-control-display-label', objectForm);
                nameDescription.innerHTML = "Name";
                let nameInput = L.DomUtil.create('input', 'leaflet-control-display-input', objectForm);
                nameInput.setAttribute('name', 'name');
                nameInput.setAttribute('value', objectName);
                nameInput.setAttribute('autocomplete', 'off');

                let idDescription = L.DomUtil.create('label', 'leaflet-control-display-label', objectForm);
                idDescription.innerHTML = "Id";
                let idInput = L.DomUtil.create('input', 'leaflet-control-display-input', objectForm);
                idInput.setAttribute('name', 'id');
                idInput.setAttribute('type', 'number');
                idInput.setAttribute('value', objectId);
                idInput.setAttribute('autocomplete', 'off');

                let submitButton = L.DomUtil.create('input', 'leaflet-control-display-submit', objectForm);
                submitButton.setAttribute('type', 'submit');
                submitButton.setAttribute('value', 'Look up');

                objectForm.addEventListener('submit', (e) => {
                    // on form submission, prevent default
                    e.preventDefault();

                    let formData = new FormData(objectForm);
                    this.submitData(formData);
                });

                //Instantiate lookup if urlparam data is present
                if (objectName || objectId) {
                    let formData = new FormData(objectForm);
                    this.submitData(formData);
                }

                return container;
            },

            submitData: function (formData) {
                let name = formData.get("name").trim();
                let id = formData.get("id").trim() ? Number.parseInt(formData.get("id").trim(), 10) : undefined;
                let names = name && (id === undefined) ? [name] : [];
                let ids = Number.isInteger(id) ? [id] : [];

                this.invokeObjectmap(names, ids);

            },

            _objectmap: undefined,

            invokeObjectmap: function (names, ids) {
                if (this._objectmap) {
                    this._objectmap.remove();
                }

                this.setSearchParams({
                    object: names[0],
                    objectid: ids[0]
                });

                if (names[0] || ids[0] || ids[0] === 0) {

                    this._objectmap = L.objects({
                            names: names,
                            ids: ids,
							folder: this.options.folder,
                        }).addTo(this._map);
                }

            },

        });

    L.control.display.objects = function (options) {
        return new L.Control.Display.Objects(options);
    }

    L.Control.Display.NPCs = L.Control.Display.extend({
            options: {
                expand: true,
                position: 'bottomleft',
                title: 'Display NPCs',
                icon: '../mejrs.github.io/images/npcs.png',
            },
            onAdd: function (map) {
                return L.Control.Display.prototype.onAdd.call(this, map);
            },

            createInterface: function () {
                let parsedUrl = new URL(window.location.href);
                let npcName = parsedUrl.searchParams.get('npc') || '';
                let npcId = parsedUrl.searchParams.get('npcid');
                let range = Number(parsedUrl.searchParams.get('range')) || 0;
                if (isNaN(range) || range < 0) {
                    throw new Error(parsedUrl.searchParams.get('range') + " is invalid");
                }

                let container = L.DomUtil.create('div', 'leaflet-control-display-expanded');

                let npcForm = L.DomUtil.create('form', 'leaflet-control-display-form', container);

                let nameDescription = L.DomUtil.create('label', 'leaflet-control-display-label', npcForm);
                nameDescription.innerHTML = "Name";
                let nameInput = L.DomUtil.create('input', 'leaflet-control-display-input', npcForm);
                nameInput.setAttribute('name', 'name');
                nameInput.setAttribute('value', npcName);
                nameInput.setAttribute('autocomplete', 'off');

                let idDescription = L.DomUtil.create('label', 'leaflet-control-display-label', npcForm);
                idDescription.innerHTML = "Id";
                let idInput = L.DomUtil.create('input', 'leaflet-control-display-input', npcForm);
                idInput.setAttribute('name', 'id');
                idInput.setAttribute('type', 'number');
                idInput.setAttribute('value', npcId);
                idInput.setAttribute('autocomplete', 'off');

                let rangeDescription = L.DomUtil.create('label', 'leaflet-control-display-label', npcForm);
                rangeDescription.innerHTML = "Wander range";
                let rangeInput = L.DomUtil.create('input', 'leaflet-control-display-input', npcForm);
                rangeInput.setAttribute('name', 'range');
                rangeInput.setAttribute('type', 'number');
                rangeInput.setAttribute('value', range ?? '7');

                let submitButton = L.DomUtil.create('input', 'leaflet-control-display-submit', npcForm);
                submitButton.setAttribute('type', 'submit');
                submitButton.setAttribute('value', 'Look up');

                npcForm.addEventListener('submit', (e) => {
                    // on form submission, prevent default
                    e.preventDefault();

                    let formData = new FormData(npcForm);
                    this.submitData(formData);
                });

                //Instantiate lookup if urlparam data is present
                if (npcName || npcId) {
                    let formData = new FormData(npcForm);
                    this.submitData(formData);
                }

                return container;
            },

            submitData: function (formData) {
                let name = formData.get("name").trim();
                let id = formData.get("id").trim() ? Number.parseInt(formData.get("id").trim(), 10) : undefined;
                let range = Number.parseInt(formData.get("range").trim()) || 0;
                let showHeat = range || false;
                let names = name && (id === undefined) ? [name] : [];
                let ids = Number.isInteger(id) ? [id] : [];

                this.invokeHeatmap(names, ids, showHeat, range);

            },

            _heatmap: undefined,

            invokeHeatmap: function (names, ids, showHeat, range) {
                if (this._heatmap) {
                    this._heatmap.remove();
                }
                this.setSearchParams({
                    npc: names[0],
                    npcid: ids[0],
                    range: range || undefined,
					
                });

                if (names[0] || ids[0] || ids[0] === 0) {

                    this._heatmap = L.heatmap({
                            npcs: names,
                            ids: ids,
                            showHeat: showHeat,
                            range: range,
							folder: this.options.folder,
                        }).addTo(this._map);
                }

            },

        });

    L.control.display.npcs = function (options) {
        return new L.Control.Display.NPCs(options);
    }

    L.Control.Display.Items = L.Control.Display.extend({
            options: {
                position: 'bottomleft',
                title: 'Display objects',
                icon: '../mejrs.github.io/images/items.png',
            },

            onAdd: function (map) {
                return L.Control.Display.prototype.onAdd.call(this, map);
            },
        });

    L.control.display.items = function (options) {
        return new L.Control.Display.Items(options);
    }

    //Just a link for now, may update it to work without redirect
    L.Control.Display.Pathfinder = L.Control.Display.extend({
            options: {
                position: 'bottomleft',
                title: 'Visit Pathfinder',
                icon: '../mejrs.github.io/images/favicon_skavid_map.png',
            },
            onAdd: function (map) {
                let container = L.Control.Display.prototype.onAdd.call(this, map);
                container.onclick = () => window.location.href = 'https://mejrs.github.io/Pathfinder';
                return container
            },
        });

    L.control.display.pathfinder = function (options) {
        return new L.Control.Display.Pathfinder(options);
    }
 });
