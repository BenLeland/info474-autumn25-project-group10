(function () {
    window.Conclusion = {
        img: null,
        
        loadImage: function(p) {
            p.loadImage('data/world-economy.jpg', img => {
                this.img = img;
            });
        },

        draw: function (p, manager, ai, progress) {
            p.push();
            if (!this.img) {
                this.loadImage(p);
            }

            p.image(this.img, manager.canvasWidth / 2 - this.img.width / 2, manager.canvasHeight / 2 - this.img.height / 2);
            p.pop();
        }
    };
})();
