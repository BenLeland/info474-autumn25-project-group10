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
            
            // Main title
            p.textSize(52);
            p.strokeWeight(2);
            p.textStyle(p.BOLD);
            p.text('The Economy, Explained Through Five Assets', cx - 600 / 2, cy - 600 / 2 + 100, 600, 600);
            
            // Subtitle
            p.textSize(18);
            p.strokeWeight(1);
            p.textStyle(p.NORMAL);
            p.fill(80);
      
            let bodyText = 'INFO 474';
            let names = 'Ben Leland, Cade Jeong, Raghav Sharma'
            let boxWidth = p.windowWidth * 0.7;
            let boxX = (p.windowWidth - boxWidth) / 2;

            p.fill(0);
            p.strokeWeight(1);
            p.textSize(21);
            p.text(bodyText, cx - 600 / 2, cy - 700 / 2 + 265, 600, 700);
            p.text(names,  cx - 600 / 2, cy - 700 / 2 + 290, 600, 700)

            p.pop();
        }
    };
})();
