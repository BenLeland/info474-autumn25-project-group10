// viz_sparklines_custom.js
// Sparklines small multiples: one sparkline per asset with hover tooltip and click-to-focus
(function() {
    window.VizSparklinesCustom = {
        assets: [
            { key: 'bitcoin', name: 'Bitcoin', file: 'data/Bitcoin Historical Data.csv', color: '#F7931A', data: [] },
            { key: 'sp500', name: 'S&P 500', file: 'data/S&P 500 Historical Data.csv', color: '#4169E1', data: [] },
            { key: 'gold', name: 'Gold', file: 'data/Gold Futures Historical Data.csv', color: '#FFD700', data: [] },
            { key: 'oil', name: 'Oil', file: 'data/Crude Oil WTI Futures Historical Data.csv', color: '#2C2C2C', data: [] },
            { key: 'usd', name: 'USD Index', file: 'data/US Dollar Index Historical Data.csv', color: '#2ECC71', data: [] }
        ],
        dataLoaded: false,
        focused: null,
        hover: null,

        parseDate: function(dateStr){ var parts = dateStr.replace(/\"/g,'').split('/'); return new Date(parts[2], parts[0]-1, parts[1]); },

        parseTable: function(table){ var rows=[]; for(var i=0;i<table.getRowCount();i++){ var dateStr = table.getString(i,'Date'); var priceStr = table.getString(i,'Price').replace(/,/g,''); rows.push({ date: this.parseDate(dateStr), dateStr: dateStr, price: parseFloat(priceStr) }); } return rows.reverse(); },

        loadData: function(p){
            var self = this; var loaded = 0; var total = this.assets.length;
            this.assets.forEach(function(a){ p.loadTable(a.file,'csv','header', function(table){ a.data = self.parseTable(table); loaded++; if (loaded===total) self.dataLoaded=true; }, function(err){ console.error('VizSparklinesCustom load error', a.file, err); loaded++; if (loaded===total) self.dataLoaded=true; }); });
        },

        handleMousePressed: function(p, manager){
            // check clicks on each sparkline box
            var left = manager.offsetX || 20; var top = manager.offsetY || 20; var cols = 1; var boxW = manager.width || 600; var boxH = 100; var pad = 20;
            for (var i=0;i<this.assets.length;i++){ var x = left; var y = top + i*(boxH+pad); if (p.mouseX >= x && p.mouseX <= x + boxW && p.mouseY >= y && p.mouseY <= y + boxH){ this.focused = this.assets[i].key; return true; } }
            return false;
        },

        handleMouseDragged: function(){ return false; },
        handleMouseReleased: function(){ return false; },

        drawSpark: function(p, x, y, w, h, data, color){ if (!data || data.length<2) return; var min = Infinity, max=-Infinity; for(var i=0;i<data.length;i++){ min=Math.min(min,data[i].price); max=Math.max(max,data[i].price); } if (min===max){ min-=1; max+=1; } p.noFill(); p.stroke(color); p.strokeWeight(2); p.beginShape(); for(var i=0;i<data.length;i++){ var px = x + (i/(data.length-1))*w; var py = y + h - ((data[i].price-min)/(max-min))*h; p.vertex(px,py); } p.endShape(); },

        draw: function(p, manager, ai, progress){
            p.push(); p.background(255);
            var left = manager.offsetX || 20; var top = manager.offsetY || 20; var w = manager.width || 600; var boxH = 90; var pad = 20; var self=this;
            if (!this.dataLoaded){ if (!this._tried){ this._tried=true; this.loadData(p); } p.fill(0); p.textAlign(p.LEFT, p.TOP); p.text('Loading sparklines...', left+20, top+20); p.pop(); return; }

            for (var i=0;i<this.assets.length;i++){
                var a = this.assets[i]; var x = left; var y = top + i*(boxH+pad);
                // box
                p.noStroke(); p.fill(245); p.rect(x, y, w, boxH, 6);
                // title
                p.fill(0); p.textAlign(p.LEFT, p.TOP); p.textSize(14); p.text(a.name + (this.focused===a.key? ' (focused)':''), x+10, y+8);
                // sparkline area
                this.drawSpark(p, x+10, y+30, w-20, boxH-40, a.data, a.color);
                // last price
                var last = a.data.length>0? a.data[a.data.length-1].price : null; p.textAlign(p.RIGHT, p.TOP); p.textSize(12); p.fill(80); p.text(last? '$'+last.toLocaleString() : 'n/a', x+w-12, y+10);
                // hover detection
                if (p.mouseX >= x && p.mouseX <= x+w && p.mouseY >= y && p.mouseY <= y+boxH){ this.hover = a.key; }
            }

            // hover tooltip
            if (this.hover){ var a = this.assets.find(function(z){ return z.key===self.hover; }); if (a){ var mx = p.mouseX, my = p.mouseY; p.fill(0,0,0,230); p.noStroke(); p.rect(mx+12, my-28, 160, 48, 6); p.fill(255); p.textAlign(p.LEFT, p.TOP); p.textSize(12); var last = a.data.length>0? a.data[a.data.length-1] : null; p.text(a.name, mx+20, my-22); if (last) p.text('Last: $'+last.price.toLocaleString(), mx+20, my-8); } }

            p.pop();
        }
    };
})();
