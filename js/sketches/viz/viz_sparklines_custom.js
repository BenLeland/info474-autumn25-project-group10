// viz_sparklines_custom.js
// Animated sparklines: shows all 5 assets growing through time with play controls
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
        
        // Animation state
        isPlaying: false,
        currentIndex: 0,
        playSpeed: 3,
        maxIndex: 0,

        parseDate: function(dateStr){ var parts = dateStr.replace(/\"/g,'').split('/'); return new Date(parts[2], parts[0]-1, parts[1]); },

        parseTable: function(table){ var rows=[]; for(var i=0;i<table.getRowCount();i++){ var dateStr = table.getString(i,'Date'); var priceStr = table.getString(i,'Price').replace(/,/g,''); rows.push({ date: this.parseDate(dateStr), dateStr: dateStr, price: parseFloat(priceStr) }); } return rows.reverse(); },

        loadData: function(p){
            var self = this; var loaded = 0; var total = this.assets.length;
            this.assets.forEach(function(a){ p.loadTable(a.file,'csv','header', function(table){ a.data = self.parseTable(table); loaded++; if (loaded===total) {
                        self.dataLoaded=true;
                        self.maxIndex = Math.max(...self.assets.map(function(asset){ return asset.data.length; }));
                        // Start at the end by default but ensure index is a valid position
                        self.currentIndex = Math.max(0, self.maxIndex);
                    } }, function(err){ console.error('VizSparklinesCustom load error', a.file, err); loaded++; if (loaded===total) { self.dataLoaded=true; self.maxIndex = Math.max(...self.assets.map(function(asset){ return asset.data.length; })); // show last available index by default
                                self.currentIndex = Math.max(0, self.maxIndex - 1); } }); });
        },

        handleMousePressed: function(p, manager){
            console.log('VizSparklinesCustom: handleMousePressed', { mouseX: p.mouseX, mouseY: p.mouseY, isPlaying: this.isPlaying, currentIndex: this.currentIndex, maxIndex: this.maxIndex });
            // Check play/pause button
            var buttonX = 50;
            var buttonY = manager.canvasHeight - 60;
            var buttonSize = 40;

            if (p.dist(p.mouseX, p.mouseY, buttonX, buttonY) < buttonSize / 2 + 5) {
                // When the user presses Play, always start playback from 0.
                // If currently paused, pressing the button will reset to 0 and start playing.
                if (!this.isPlaying) {
                    this.currentIndex = 0;
                    this.isPlaying = true;
                    console.log('VizSparklinesCustom: play pressed -> starting from 0');
                } else {
                    // If it's playing, the button pauses playback (no reset)
                    this.isPlaying = false;
                    console.log('VizSparklinesCustom: pause pressed');
                }
                return true;
            }
            
            // Check slider
            var sliderX = 120;
            var sliderY = manager.canvasHeight - 60;
            var sliderWidth = manager.canvasWidth - 250;
            
            if (p.mouseX >= sliderX && p.mouseX <= sliderX + sliderWidth &&
                p.mouseY >= sliderY - 10 && p.mouseY <= sliderY + 10) {
                var progress = (p.mouseX - sliderX) / sliderWidth;
                this.currentIndex = Math.floor(progress * this.maxIndex);
                this.isPlaying = false;
                return true;
            }
            
            return false;
        },

        handleMouseDragged: function(p, manager){
            // Allow dragging slider
            var sliderX = 120;
            var sliderY = manager.canvasHeight - 60;
            var sliderWidth = manager.canvasWidth - 250;
            
            if (p.mouseX >= sliderX - 20 && p.mouseX <= sliderX + sliderWidth + 20 &&
                p.mouseY >= sliderY - 20 && p.mouseY <= sliderY + 20) {
                var progress = Math.max(0, Math.min(1, (p.mouseX - sliderX) / sliderWidth));
                this.currentIndex = Math.floor(progress * this.maxIndex);
                this.isPlaying = false;
                return true;
            }
            return false;
        },
        
        handleMouseReleased: function(){ return false; },

        drawLineChart: function(p, x, y, w, h, asset){
            if (!asset.data || asset.data.length < 2) return;

            // Avoid division by zero when maxIndex is 0 or 1
            if (this.maxIndex <= 1) return;

            var dataSlice = asset.data.slice(0, Math.min(this.currentIndex, asset.data.length));
            if (dataSlice.length < 2) return;
            
            var min = Infinity, max=-Infinity;
            for(var i=0;i<dataSlice.length;i++){ 
                min=Math.min(min,dataSlice[i].price); 
                max=Math.max(max,dataSlice[i].price); 
            }
            if (min===max){ min-=1; max+=1; }
            
            p.noFill(); 
            p.stroke(asset.color); 
            p.strokeWeight(3); 
            p.beginShape();
            for(var i=0;i<dataSlice.length;i++){ 
                var px = x + (i/(this.maxIndex-1))*w; 
                var py = y + h - ((dataSlice[i].price-min)/(max-min))*h; 
                p.vertex(px,py); 
            }
            p.endShape();
            
            // Draw current point
            if (dataSlice.length > 0) {
                var lastPoint = dataSlice[dataSlice.length - 1];
                var px = x + ((dataSlice.length-1)/(this.maxIndex-1))*w;
                var py = y + h - ((lastPoint.price-min)/(max-min))*h;
                p.fill(asset.color);
                p.noStroke();
                p.circle(px, py, 8);
            }
        },

        drawControls: function(p, manager){
            // Play/Pause button
            var buttonX = 50;
            var buttonY = manager.canvasHeight - 60;
            var buttonSize = 40;
            
            p.fill(100, 150, 255);
            p.noStroke();
            p.circle(buttonX, buttonY, buttonSize);
            
            p.fill(255);
            if (this.isPlaying) {
                p.rect(buttonX - 7, buttonY - 10, 4, 20);
                p.rect(buttonX + 3, buttonY - 10, 4, 20);
            } else {
                p.triangle(buttonX - 6, buttonY - 10, buttonX - 6, buttonY + 10, buttonX + 8, buttonY);
            }
            
            // Timeline slider
            var sliderX = 120;
            var sliderY = buttonY;
            var sliderWidth = manager.canvasWidth - 250;
            var sliderHeight = 8;
            
            // Track
            p.fill(200);
            p.noStroke();
            p.rect(sliderX, sliderY - sliderHeight/2, sliderWidth, sliderHeight, 4);
            
            // Progress (use maxIndex-1 as the last valid index)
            var denom = Math.max(1, this.maxIndex - 1);
            var progress = this.currentIndex / denom;
            p.fill(100, 150, 255);
            p.rect(sliderX, sliderY - sliderHeight/2, sliderWidth * progress, sliderHeight, 4);
            
            // Handle
            var handleX = sliderX + sliderWidth * progress;
            p.fill(100, 150, 255);
            p.stroke(255);
            p.strokeWeight(2);
            p.circle(handleX, sliderY, 16);
            
            // Date labels
            p.fill(0);
            p.noStroke();
            p.textSize(12);
            p.textAlign(p.LEFT, p.TOP);
            if (this.assets[0] && this.assets[0].data && this.assets[0].data.length > 0) {
                var firstDate = this.assets[0].data[0].date;
                var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                p.text(months[firstDate.getMonth()] + ' ' + firstDate.getFullYear(), sliderX, sliderY + 15);
            }
            p.textAlign(p.RIGHT, p.TOP);
            if (this.assets[0] && this.assets[0].data && this.assets[0].data.length > 0) {
                var lastDate = this.assets[0].data[this.assets[0].data.length - 1].date;
                var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                p.text(months[lastDate.getMonth()] + ' ' + lastDate.getFullYear(), sliderX + sliderWidth, sliderY + 15);
            }
            
            // Current date
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(14);
            if (this.assets[0] && this.assets[0].data && this.assets[0].data.length > 0) {
                var currentDate = this.assets[0].data[Math.min(this.currentIndex, this.assets[0].data.length - 1)].date;
                var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                p.text(months[currentDate.getMonth()] + ' ' + currentDate.getFullYear(), manager.canvasWidth / 2, sliderY + 15);
            }
        },

        // Create a simple DOM play/pause button overlay to avoid relying solely on p5 mouse events
        ensureDOMControls: function(manager) {
            try {
                var container = document.getElementById('vis');
                if (!container) return;

                var btnId = 'viz-sparklines-play-btn';
                var existing = document.getElementById(btnId);
                var self = this;

                function updateButton() {
                    if (!existing) return;
                    existing.innerHTML = '';
                    existing.style.background = 'rgb(100,150,255)';
                    existing.style.border = 'none';
                    existing.style.display = 'flex';
                    existing.style.alignItems = 'center';
                    existing.style.justifyContent = 'center';
                    existing.style.cursor = 'pointer';
                    // icon
                    if (self.isPlaying) {
                        // pause icon
                        existing.innerHTML = '<div style="width:12px;height:18px;display:flex;gap:6px"><div style="width:4px;height:18px;background:#fff"></div><div style="width:4px;height:18px;background:#fff"></div></div>';
                    } else {
                        // play icon
                        existing.innerHTML = '<div style="width:0;height:0;border-left:12px solid #fff;border-top:9px solid transparent;border-bottom:9px solid transparent;margin-left:3px"></div>';
                    }
                }

                if (!existing) {
                    existing = document.createElement('button');
                    existing.id = btnId;
                    existing.setAttribute('aria-label', 'Play timeline');
                    existing.style.position = 'absolute';
                    existing.style.left = '40px';
                    existing.style.bottom = '60px';
                    existing.style.width = '48px';
                    existing.style.height = '48px';
                    existing.style.borderRadius = '50%';
                    existing.style.zIndex = 9999;
                    existing.style.boxShadow = '0 6px 18px rgba(0,0,0,0.15)';
                    existing.style.outline = 'none';
                    existing.style.padding = '0';
                    existing.onclick = function (e) {
                        e.stopPropagation();
                        // Toggle playback: when starting, reset to 0
                        if (!self.isPlaying) {
                            self.currentIndex = 0;
                            self.isPlaying = true;
                        } else {
                            self.isPlaying = false;
                        }
                        updateButton();
                    };
                    container.appendChild(existing);
                }

                // keep visual state in sync
                updateButton();
            } catch (e) {
                console.error('ensureDOMControls error', e);
            }
        },

        draw: function(p, manager, ai, progress){
            p.push(); 
            p.background(255);
            
            if (!this.dataLoaded){ 
                if (!this._tried){ this._tried=true; console.log('VizSparklinesCustom: initiating loadData'); this.loadData(p); } 
                p.fill(0); 
                p.textAlign(p.CENTER, p.CENTER); 
                p.textSize(24);
                p.text('Loading timeline data...', manager.canvasWidth / 2, manager.canvasHeight / 2); 
                p.pop(); 
                return; 
            }
            
            // Animation
            if (this.isPlaying) {
                this.currentIndex += this.playSpeed;
                // Cap at last valid index (maxIndex - 1) and stop playback
                if (this.currentIndex >= this.maxIndex - 1) {
                    this.currentIndex = Math.max(0, this.maxIndex - 1);
                    this.isPlaying = false;
                }
            }
            
            // Draw combined chart
            var chartX = 60;
            var chartY = 40;
            var chartW = manager.canvasWidth - 140;
            var chartH = manager.canvasHeight - 180;
            
            // Title
            p.fill(0);
            p.noStroke();
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(20);
            p.textStyle(p.BOLD);
            p.text('All Five Assets Over Time', manager.canvasWidth / 2, 10);
            
            // Chart background
            p.fill(250);
            p.noStroke();
            p.rect(chartX, chartY, chartW, chartH, 8);
            
            // Grid lines
            p.stroke(230);
            p.strokeWeight(1);
            for (var i = 0; i <= 4; i++) {
                var y = chartY + (chartH / 4) * i;
                p.line(chartX, y, chartX + chartW, y);
            }
            
            // Draw all asset lines
            for (var i = 0; i < this.assets.length; i++) {
                this.drawLineChart(p, chartX, chartY, chartW, chartH, this.assets[i]);
            }
            
            // Legend
            var legendX = chartX + 20;
            var legendY = chartY + 20;
            for (var i = 0; i < this.assets.length; i++) {
                var a = this.assets[i];
                p.fill(a.color);
                p.noStroke();
                p.circle(legendX, legendY + i * 25, 10);
                p.fill(0);
                p.textAlign(p.LEFT, p.CENTER);
                p.textSize(14);
                p.textStyle(p.NORMAL);
                p.text(a.name, legendX + 15, legendY + i * 25);
            }
            
            // Controls
            this.drawControls(p, manager);
            // Ensure a DOM play/pause button exists so clicks reliably control playback
            this.ensureDOMControls(manager);
            
            p.pop();
        }
    };
})();
