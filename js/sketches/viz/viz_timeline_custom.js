// viz_timeline_custom.js
// Multi-asset timeline with slider and play/pause. Loads the CSVs in /data/
(function() {
    window.VizTimelineCustom = {
        assets: {
            bitcoin: { name: 'Bitcoin', file: 'data/Bitcoin Historical Data.csv', color: '#F7931A', data: [] },
            sp500:   { name: 'S&P 500', file: 'data/S&P 500 Historical Data.csv', color: '#4169E1', data: [] },
            gold:    { name: 'Gold', file: 'data/Gold Futures Historical Data.csv', color: '#FFD700', data: [] },
            oil:     { name: 'Oil', file: 'data/Crude Oil WTI Futures Historical Data.csv', color: '#2C2C2C', data: [] },
            usd:     { name: 'USD Index', file: 'data/US Dollar Index Historical Data.csv', color: '#2ECC71', data: [] }
        },
        dataLoaded: false,
        allDates: [],
        // Event markers to display on the timeline
        events: [
            { dateStr: '03/11/2020', label: 'COVID-19 Pandemic Declared', color: '#FF4444' },
            { dateStr: '02/24/2022', label: 'Ukraine War Begins', color: '#FF8800' },
            { dateStr: '03/10/2023', label: 'SVB Collapse', color: '#8800FF' }
        ],
        eventIndices: [],
        currentIndex: 0,
        isPlaying: false,
        playSpeed: 1,
        isDraggingSlider: false,
        enabled: { bitcoin: true, sp500: true, gold: true, oil: true, usd: true },

        parseDate: function(dateStr) {
            var parts = dateStr.replace(/\"/g, '').split('/');
            return new Date(parts[2], parts[0]-1, parts[1]);
        },

        parseTable: function(table) {
            var rows = [];
            for (var i=0;i<table.getRowCount();i++){
                var dateStr = table.getString(i, 'Date');
                var priceStr = table.getString(i, 'Price').replace(/,/g,'');
                var changeStr = table.getString(i, 'Change %') ? table.getString(i, 'Change %').replace('%','') : '0';
                rows.push({ date: this.parseDate(dateStr), dateStr: dateStr, price: parseFloat(priceStr), changePercent: parseFloat(changeStr) });
            }
            return rows.reverse();
        },

        loadData: function(p, manager) {
            var self = this;
            var keys = Object.keys(this.assets);
            var loaded = 0;
            var total = keys.length;

            keys.forEach(function(key){
                var asset = self.assets[key];
                p.loadTable(asset.file, 'csv', 'header', function(table){
                    asset.data = self.parseTable(table);
                    loaded++;
                    if (loaded === total) {
                        self.initialize();
                    }
                }, function(err){
                    console.error('VizTimelineCustom: failed loading', asset.file, err);
                    loaded++;
                    if (loaded === total) self.initialize();
                });
            });
        },

        initialize: function(){
            var dateSet = new Set();
            var self = this;
            Object.keys(this.assets).forEach(function(k){
                var a = self.assets[k];
                a.data.forEach(function(d){ dateSet.add(d.date.getTime()); });
            });
            this.allDates = Array.from(dateSet).sort(function(a,b){return a-b;}).map(function(t){return new Date(t);});
            // compute event indices (closest match on the unified timeline)
            this.eventIndices = this.events.map(function(ev){
                var parts = ev.dateStr.split('/');
                var ed = new Date(parts[2], parts[0]-1, parts[1]);
                var bestIdx = -1; var bestDiff = Infinity;
                for (var i=0;i<self.allDates.length;i++){
                    var diff = Math.abs(self.allDates[i].getTime() - ed.getTime());
                    if (diff < bestDiff){ bestDiff = diff; bestIdx = i; }
                }
                return bestIdx;
            });
            if (this.allDates.length>0) this.dataLoaded = true;
            this.currentIndex = 0;
        },

        getPricesAtIndex: function(idx){
            var d = this.allDates[idx];
            var prices = {};
            var self = this;
            Object.keys(this.assets).forEach(function(k){
                var asset = self.assets[k];
                var closest = null; var minDiff = Infinity;
                asset.data.forEach(function(p){
                    var diff = Math.abs(p.date.getTime() - d.getTime());
                    if (diff < minDiff){ minDiff = diff; closest = p; }
                });
                prices[k] = closest || null;
            });
            return prices;
        },

        handleMousePressed: function(p, manager){
            var sliderX = 100, sliderY = manager.canvasHeight - 80, sliderW = manager.canvasWidth - 200;
            var buttonX = 40, buttonY = sliderY + 5, buttonSize = 30;
            if (p.dist(p.mouseX, p.mouseY, buttonX, buttonY) < buttonSize/2){
                this.isPlaying = !this.isPlaying; return true;
            }
            if (p.mouseX >= sliderX && p.mouseX <= sliderX+sliderW && p.mouseY >= sliderY-10 && p.mouseY <= sliderY+20){
                this.isDraggingSlider = true; this.updateSliderPosition(p, manager); return true;
            }
            // toggles area (right side)
            var toggleStartY = 30, toggleX = manager.canvasWidth - 160;
            var keys = Object.keys(this.assets), self = this;
            for (var i=0;i<keys.length;i++){
                var ty = toggleStartY + i*35;
                if (p.mouseX >= toggleX && p.mouseX <= toggleX+16 && p.mouseY >= ty-8 && p.mouseY <= ty+8){
                    var key = keys[i]; this.enabled[key] = !this.enabled[key]; return true;
                }
            }
            return false;
        },

        handleMouseDragged: function(p, manager){ if (this.isDraggingSlider){ this.updateSliderPosition(p, manager); return true; } return false; },
        handleMouseReleased: function(p, manager){ if (this.isDraggingSlider){ this.isDraggingSlider = false; return true; } return false; },

        updateSliderPosition: function(p, manager){
            var sliderX = 100, sliderW = manager.canvasWidth - 200;
            var progress = Math.max(0, Math.min(1, (p.mouseX - sliderX)/sliderW));
            this.currentIndex = Math.floor(progress * (this.allDates.length-1));
        },

        formatDate: function(date){
            var m = date.getMonth()+1; var d = date.getDate(); var y = date.getFullYear();
            return m + '/' + d + '/' + y;
        },

        draw: function(p, manager, ai, progress){
            p.push();
            p.background(255);
            p.fill(0);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(14);

            if (!this.dataLoaded){
                // attempt to load once
                if (!this._triedLoad){ this._triedLoad = true; this.loadData(p, manager); }
                p.text('Loading timeline data...', manager.canvasWidth/2, manager.canvasHeight/2);
                p.pop(); return;
            }

            // layout
            var left = manager.offsetX || 20; var top = manager.offsetY || 20;
            var w = manager.width || 600; var h = manager.height || 520;
            var chartW = w - 220; var chartH = h - 160;
            var chartX = left + 20; var chartY = top + 20;

            // compute global min/max price across enabled assets for scaling
            var minP = Infinity, maxP = -Infinity;
            var keys = Object.keys(this.assets), self = this;
            keys.forEach(function(k){ if (!self.enabled[k]) return; self.assets[k].data.forEach(function(pt){ if (!isNaN(pt.price)){ minP = Math.min(minP, pt.price); maxP = Math.max(maxP, pt.price); } }); });
            if (minP === Infinity || maxP === -Infinity){ minP = 0; maxP = 1; }

            // x scale uses allDates
            var n = this.allDates.length;
            var xForIndex = function(i){ return chartX + (i / Math.max(1, n-1)) * chartW; };
            var yForPrice = function(price){ return chartY + chartH - ((price - minP) / (maxP - minP)) * chartH; };

            // draw grid and axes
            p.stroke(220); 
            p.strokeWeight(1);
            for (var gy=0; gy<=4; gy++){ 
                var yy = chartY + (gy/4)*chartH; 
                p.line(chartX, yy, chartX+chartW, yy); 
            }
            
            // Y-axis labels with price range
            p.noStroke();
            p.fill(80);
            p.textAlign(p.RIGHT, p.CENTER);
            p.textSize(11);
            for (var gy=0; gy<=4; gy++){
                var yy = chartY + (gy/4)*chartH;
                var priceVal = maxP - (gy/4) * (maxP - minP);
                p.text('$' + priceVal.toFixed(0), chartX - 10, yy);
            }
            
            // X-axis labels (start and end dates)
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(11);
            var startDate = this.allDates[0];
            var endDate = this.allDates[this.allDates.length - 1];
            p.text(this.formatDate(startDate), chartX, chartY + chartH + 5);
            p.text(this.formatDate(endDate), chartX + chartW, chartY + chartH + 5);

            // draw lines for each enabled asset
            keys.forEach(function(k){ 
                var asset = self.assets[k]; 
                if (!self.enabled[k]) return; 
                
                p.noFill(); 
                p.stroke(asset.color); 
                
                // Increase stroke weight for oil to make it more visible
                if (k === 'oil') {
                    p.strokeWeight(3);
                } else {
                    p.strokeWeight(2);
                }
                
                p.beginShape();
                for (var i=0;i<asset.data.length;i++){ 
                    var idx = self.allDates.indexOf(asset.data[i].date); 
                    if (idx<0) {
                        // find index by time
                        for (var j=0;j<self.allDates.length;j++){ 
                            if (self.allDates[j].getTime()===asset.data[i].date.getTime()){ 
                                idx=j; 
                                break; 
                            } 
                        }
                    }
                    var x = xForIndex(idx>=0?idx:0); 
                    var y = yForPrice(asset.data[i].price); 
                    p.vertex(x,y);
                }
                p.endShape();
                
                // Add circular markers for oil line to make it more visible
                if (k === 'oil') {
                    p.fill(asset.color);
                    for (var i=0;i<asset.data.length;i+=20){ // Every 20th point for clarity
                        var idx = self.allDates.indexOf(asset.data[i].date); 
                        if (idx<0) {
                            for (var j=0;j<self.allDates.length;j++){ 
                                if (self.allDates[j].getTime()===asset.data[i].date.getTime()){ 
                                    idx=j; 
                                    break; 
                                } 
                            }
                        }
                        var x = xForIndex(idx>=0?idx:0); 
                        var y = yForPrice(asset.data[i].price);
                        p.circle(x, y, 5);
                    }
                }
            });

            // draw event markers (vertical lines, no overlapping labels)
            if (this.eventIndices && this.eventIndices.length){
                p.textSize(11);
                p.textStyle(p.BOLD);
                for (var ei=0; ei<this.eventIndices.length; ei++){
                    var idx = this.eventIndices[ei]; 
                    if (idx < 0 || idx >= this.allDates.length) continue;
                    var ex = xForIndex(idx);
                    var ev = this.events[ei];
                    
                    // Draw vertical line
                    p.stroke(ev.color);
                    p.strokeWeight(2);
                    p.line(ex, chartY, ex, chartY + chartH);
                    
                    // Draw label with staggered heights to avoid overlap
                    p.noStroke();
                    p.fill(ev.color);
                    var labelY = chartY - 12 - (ei % 2) * 20; // Stagger labels
                    p.textAlign(p.CENTER, p.BOTTOM);
                    p.text(ev.label, ex, labelY);
                }
                p.textStyle(p.NORMAL);
            }

            // Draw slider
            var sliderX = chartX; var sliderY = chartY + chartH + 30; var sliderW = chartW;
            p.noStroke(); p.fill(200); p.rect(sliderX, sliderY, sliderW, 10, 5);
            var progressVal = this.currentIndex / Math.max(1, this.allDates.length-1);
            p.fill(100,150,255); p.rect(sliderX, sliderY, sliderW*progressVal, 10, 5);
            var handleX = sliderX + sliderW*progressVal; p.fill(255); p.stroke(0); p.circle(handleX, sliderY+5, 18);

            // Play button
            var buttonX = chartX - 60; var buttonY = sliderY + 5; p.noStroke(); p.fill(100,150,255); p.circle(buttonX, buttonY, 30);
            p.fill(255); if (this.isPlaying){ p.rect(buttonX-5, buttonY-7, 3, 14); p.rect(buttonX+2, buttonY-7, 3, 14); } else { p.triangle(buttonX-6, buttonY-8, buttonX-6, buttonY+8, buttonX+6, buttonY); }

            // toggles (right side - already sufficient, no need for duplicate info)
            var toggleStartY = 30; 
            p.textAlign(p.LEFT, p.CENTER); 
            p.textSize(13);
            for (var i=0;i<keys.length;i++){ 
                var ty = toggleStartY + i*35; 
                var key = keys[i]; 
                var asset = this.assets[key]; 
                
                // Checkbox
                p.stroke(asset.color); 
                p.strokeWeight(2); 
                if (this.enabled[key]) {
                    p.fill(asset.color);
                } else {
                    p.noFill();
                }
                p.rect(chartX + chartW + 20, ty-8, 16, 16, 3); 
                
                // Asset name
                p.noStroke(); 
                p.fill(this.enabled[key]?255:120); 
                p.text(asset.name, chartX + chartW + 46, ty); 
            }

            // date label
            p.noStroke(); 
            p.fill(0); 
            p.textAlign(p.CENTER, p.TOP); 
            p.textSize(14);
            var curDate = this.allDates[this.currentIndex]; 
            p.text(this.formatDate(curDate), chartX + chartW/2, sliderY + 20);

            // advance time if playing
            if (this.isPlaying){ this.currentIndex += this.playSpeed; if (this.currentIndex >= this.allDates.length) { this.currentIndex = this.allDates.length-1; this.isPlaying = false; } }

            p.pop();
        }
    };
})();
