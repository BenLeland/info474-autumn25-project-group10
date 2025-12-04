// sketch_renderer.js

// Responsible for rendering the main visualization based on the current active index
(function () {
    window.Renderer = {

        setData: function (manager) {
            var self = this;

            manager.offsetX = (manager.margin && manager.margin.left) || 20;
            manager.offsetY = (manager.margin && manager.margin.top) || 0;

            function computeLayout(data) {
                manager.data = data;
            }

            computeLayout([]);
            
            // Initialize personality cards visualization
            if (window.VizPersonalityCards && window.VizPersonalityCards.setup) {
                window.VizPersonalityCards.setup(manager.p5);
            }
            
            return Promise.resolve(manager.data);
        },

        draw: function (p, manager, ai, progress) {
            try { console.log('Renderer: delegating draw, ai=', ai); } catch (e) { }

            if (ai === 0 || ai === 1) {
                window.VizTitle.draw(p, manager, ai, progress);
                return;
            }

            if (ai === 2 || ai === 3) {
                window.VizBubbles.draw(p, manager, ai, progress);
                return;
            }

            // Asset Personality Cards (indices 5-9 only)
            if (ai >= 5 && ai <= 9) {
                if (window.VizPersonalityCards) {
                    window.VizPersonalityCards.draw(p, manager, ai, progress);
                }
                return;
            }

            // Custom scaffolds: map a couple new activeIndex values
            if (ai === 11 || ai === 12) {
                if (window.VizTimelineCustom) window.VizTimelineCustom.draw(p, manager, ai, progress);
                return;
            }

            if (ai === 13) {
                if (window.VizSparklinesCustom) window.VizSparklinesCustom.draw(p, manager, ai, progress);
                return;
            }

            // Correlation Heatmap (index 14)
            if (ai === 14) {
                if (window.VizCorrelationHeatmap) window.VizCorrelationHeatmap.draw(p, manager, ai, progress);
                return;
            }

            if (ai === 10) {
                window.CurrencyValueOverTime.draw(p, manager, ai, progress);
                return;
            }
        },

        handleMousePressed: function (p, manager, ai) {
            if (ai === 3 || ai === 4) {
                return window.VizBubbles.handleMousePressed(p, manager);
            }
            if (ai === 14 && window.VizTimelineCustom && window.VizTimelineCustom.handleMousePressed) {
                return window.VizTimelineCustom.handleMousePressed(p, manager);
            }
            if (ai === 15 && window.VizSparklinesCustom && window.VizSparklinesCustom.handleMousePressed) {
                return window.VizSparklinesCustom.handleMousePressed(p, manager);
            }
            return false;
        },

        handleMouseDragged: function (p, manager, ai) {
            if (ai === 3 || ai === 4) {
                return window.VizBubbles.handleMouseDragged(p, manager);
            }
            if (ai === 14 && window.VizTimelineCustom && window.VizTimelineCustom.handleMouseDragged) {
                return window.VizTimelineCustom.handleMouseDragged(p, manager);
            }
            if (ai === 15 && window.VizSparklinesCustom && window.VizSparklinesCustom.handleMouseDragged) {
                return window.VizSparklinesCustom.handleMouseDragged(p, manager);
            }
            return false;
        },

        handleMouseReleased: function (p, manager, ai) {
            if (ai === 3 || ai === 4) {
                return window.VizBubbles.handleMouseReleased(p, manager);
            }
            if (ai === 14 && window.VizTimelineCustom && window.VizTimelineCustom.handleMouseReleased) {
                return window.VizTimelineCustom.handleMouseReleased(p, manager);
            }
            if (ai === 15 && window.VizSparklinesCustom && window.VizSparklinesCustom.handleMouseReleased) {
                return window.VizSparklinesCustom.handleMouseReleased(p, manager);
            }
            return false;
        }
    };
})();
