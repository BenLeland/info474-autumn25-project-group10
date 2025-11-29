// viz_title.js
// Draw title-style screens for early active indexes (0 and 1)
(function () {
    window.VizTitle = {
        draw: function (p, manager, ai, progress) {
            var cx = (manager.offsetX || 0) + (manager.width || 600) / 2;
            var cy = (manager.offsetY || 0) + (manager.height || 520) / 3;

            p.push();
            p.fill(0);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(48);
            p.strokeWeight(2);
            p.text('The Forces that Shape the Value of Money', cx - 600 / 2, cy - 600 / 2, 600, 600);

            let bodyText = 'Since the beginning of the modern world, the importance of currency has always stayed the same. What has not stayed the same is the value of any currency. Outside factors like war, policy, and technological advances have changed how society works and more importantly the value of money. We aim to show how the value of currency changes over time and why some large events can create large shifts in economic power. Not only that, but if we compare currencies, what has the most power and how can people invest their money to be the most safe from outside factors.';
            let boxWidth = p.windowWidth * 0.7;
            let boxX = (p.windowWidth - boxWidth) / 2;

            p.strokeWeight(1);
            p.textSize(21);
            p.text(bodyText, cx - 600 / 2, cy - 700 / 2 + 225, 600, 700);

            p.pop();
        }
    };
})();
