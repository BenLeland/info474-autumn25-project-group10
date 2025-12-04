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
            p.text('The Forces that Shape the Value of Money', cx - 600 / 2, cy - 600 / 2 + 120, 600, 600);

            let bodyText = 'INFO 474';
            let names = 'Ben Leland, Cade Jeong, Raghav Sharma'
            let boxWidth = p.windowWidth * 0.7;
            let boxX = (p.windowWidth - boxWidth) / 2;

            p.strokeWeight(1);
            p.textSize(21);
            p.text(bodyText, cx - 600 / 2, cy - 700 / 2 + 225, 600, 700);
            p.text(names,  cx - 600 / 2, cy - 700 / 2 + 250, 600, 700)

            p.pop();
        }
    };
})();
