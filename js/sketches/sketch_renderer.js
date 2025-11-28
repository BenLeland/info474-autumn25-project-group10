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

            // Asset Personality Cards (indices 4-9)
            if (ai >= 4 && ai <= 9) {
                if (window.VizPersonalityCards) {
                    window.VizPersonalityCards.draw(p, manager, ai, progress);
                }
                return;
            }

            if (ai >= 10 && ai < 12) {
                window.VizScatter.draw(p, manager, ai, progress);
                return;
            }

            if (ai === 12) {
                window.VizBar.draw(p, manager, ai, progress);
                return;
            }
        },

        handleMousePressed: function (p, manager, ai) {
            if (ai === 2 || ai === 3) {
                return window.VizBubbles.handleMousePressed(p, manager);
            }
            return false;
        },

        handleMouseDragged: function (p, manager, ai) {
            if (ai === 2 || ai === 3) {
                return window.VizBubbles.handleMouseDragged(p, manager);
            }
            return false;
        },

        handleMouseReleased: function (p, manager, ai) {
            if (ai === 2 || ai === 3) {
                return window.VizBubbles.handleMouseReleased(p, manager);
            }
            return false;
        }
    };
})();
