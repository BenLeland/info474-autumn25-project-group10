// viz_bubbles.js
// Asset Performance Bubbles Visualization
(function () {
    window.VizBubbles = {
        // Data structures
        assets: {
            bitcoin: { 
                name: 'Bitcoin', 
                color: '#F7931A', 
                data: [], 
                enabled: true,
                currentSize: 120,
                targetSize: 120,
                x: 0, y: 0,
                hasData: false
            },
            sp500: { 
                name: 'S&P 500', 
                color: '#4169E1', 
                data: [], 
                enabled: true,
                currentSize: 120,
                targetSize: 120,
                x: 0, y: 0,
                hasData: false
            },
            gold: { 
                name: 'Gold', 
                color: '#FFD700', 
                data: [], 
                enabled: true,
                currentSize: 120,
                targetSize: 120,
                x: 0, y: 0,
                hasData: false
            },
            oil: { 
                name: 'Oil', 
                color: '#2C2C2C', 
                data: [], 
                enabled: true,
                currentSize: 120,
                targetSize: 120,
                x: 0, y: 0,
                hasData: false
            },
            usd: { 
                name: 'USD Index', 
                color: '#2ECC71', 
                data: [], 
                enabled: true,
                currentSize: 120,
                targetSize: 120,
                x: 0, y: 0,
                hasData: false
            }
        },

        // Constants
        MIN_BUBBLE_SIZE: 50,
        MAX_BUBBLE_SIZE: 350,
        BASE_SIZE: 120,
        LERP_FACTOR: 0.15,

        // Timeline control
        currentIndex: 0,
        isPlaying: false,
        playSpeed: 2,

        // Data
        dataLoaded: false,
        earliestDate: null,
        latestDate: null,
        allDates: [],
        hoveredBubble: null,
        isDraggingSlider: false,

        // Historical events
        events: [
            { date: '03/11/2020', name: 'COVID-19 Pandemic Declared', color: '#FF0000' },
            { date: '03/23/2020', name: 'Market Bottom (COVID)', color: '#FF4444' },
            { date: '01/06/2021', name: 'US Capitol Attack', color: '#FF8800' },
            { date: '02/24/2022', name: 'Ukraine War Begins', color: '#FF0088' },
            { date: '03/10/2023', name: 'Silicon Valley Bank Collapse', color: '#8800FF' }
        ],

        init: function(p, manager) {
            var self = this;
            
            // Load data files if not already loaded
            if (!this.dataLoaded && Object.keys(this.assets).every(key => this.assets[key].data.length === 0)) {
                this.loadData(p, manager);
            }
        },

        loadData: function(p, manager) {
            var self = this;
            var loadedCount = 0;
            var totalFiles = 5;

            function checkAllLoaded() {
                loadedCount++;
                if (loadedCount === totalFiles) {
                    self.initializeData();
                    self.positionBubbles(manager);
                }
            }

            p.loadTable('data/Bitcoin Historical Data.csv', 'csv', 'header', function(table) {
                self.assets.bitcoin.data = self.parseTable(table);
                checkAllLoaded();
            });
            p.loadTable('data/S&P 500 Historical Data.csv', 'csv', 'header', function(table) {
                self.assets.sp500.data = self.parseTable(table);
                checkAllLoaded();
            });
            p.loadTable('data/Gold Futures Historical Data.csv', 'csv', 'header', function(table) {
                self.assets.gold.data = self.parseTable(table);
                checkAllLoaded();
            });
            p.loadTable('data/Crude Oil WTI Futures Historical Data.csv', 'csv', 'header', function(table) {
                self.assets.oil.data = self.parseTable(table);
                checkAllLoaded();
            });
            p.loadTable('data/US Dollar Index Historical Data.csv', 'csv', 'header', function(table) {
                self.assets.usd.data = self.parseTable(table);
                checkAllLoaded();
            });
        },

        parseTable: function(table) {
            var data = [];
            for (var i = 0; i < table.getRowCount(); i++) {
                var dateStr = table.getString(i, 'Date');
                var priceStr = table.getString(i, 'Price').replace(/,/g, '');
                var changeStr = table.getString(i, 'Change %').replace('%', '');
                
                data.push({
                    date: this.parseDate(dateStr),
                    dateStr: dateStr,
                    price: parseFloat(priceStr),
                    changePercent: parseFloat(changeStr)
                });
            }
            return data.reverse();
        },

        parseDate: function(dateStr) {
            var parts = dateStr.split('/');
            return new Date(parts[2], parts[0] - 1, parts[1]);
        },

        initializeData: function() {
            var allAssetDates = [];
            var self = this;
            
            Object.keys(this.assets).forEach(function(key) {
                if (self.assets[key].data.length > 0) {
                    self.assets[key].data.forEach(function(d) {
                        allAssetDates.push(d.date.getTime());
                    });
                }
            });
            
            if (allAssetDates.length === 0) return;
            
            this.earliestDate = new Date(Math.min.apply(null, allAssetDates));
            this.latestDate = new Date(Math.max.apply(null, allAssetDates));
            
            this.createTimeline();
            this.dataLoaded = true;
            this.currentIndex = 0;
            this.updateBubbleSizes();
        },

        createTimeline: function() {
            this.allDates = [];
            var current = new Date(this.earliestDate);
            
            while (current <= this.latestDate) {
                this.allDates.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }
        },

        positionBubbles: function(manager) {
            var centerX = manager.canvasWidth / 2;
            var centerY = (manager.canvasHeight / 2) + 10; // Centered with more space
            var radius = 180; // Reduced radius so bubbles fit better
            
            var keys = Object.keys(this.assets);
            var angleStep = (2 * Math.PI) / keys.length;
            var self = this;
            
            keys.forEach(function(key, i) {
                var angle = i * angleStep - Math.PI / 2;
                self.assets[key].x = centerX + Math.cos(angle) * radius;
                self.assets[key].y = centerY + Math.sin(angle) * radius;
            });
        },

        updateBubbleSizes: function() {
            if (!this.dataLoaded || this.allDates.length === 0) return;
            
            var currentDate = this.allDates[this.currentIndex];
            var self = this;
            
            Object.keys(this.assets).forEach(function(key) {
                var asset = self.assets[key];
                var closestData = null;
                var minDiff = Infinity;
                
                asset.data.forEach(function(d) {
                    var diff = Math.abs(d.date.getTime() - currentDate.getTime());
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestData = d;
                    }
                });
                
                if (closestData) {
                    var dailyChange = closestData.changePercent;
                    var normalizedChange = (dailyChange + 5) / 10;
                    var clampedChange = Math.max(0, Math.min(1, normalizedChange));
                    
                    asset.targetSize = self.MIN_BUBBLE_SIZE + (self.MAX_BUBBLE_SIZE - self.MIN_BUBBLE_SIZE) * clampedChange;
                    asset.currentData = closestData;
                    asset.hasData = true;
                } else {
                    asset.hasData = false;
                }
            });
        },

        draw: function (p, manager, ai, progress) {
            var self = this;
            
            // Initialize if needed
            if (!this.dataLoaded) {
                this.init(p, manager);
                p.fill(255);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(24);
                p.text('Loading data...', manager.canvasWidth / 2, manager.canvasHeight / 2);
                return;
            }
            
            // Ensure bubbles are positioned (in case canvas size changed)
            this.positionBubbles(manager);
            
            // Update animation
            if (this.isPlaying) {
                this.currentIndex += this.playSpeed;
                if (this.currentIndex >= this.allDates.length) {
                    this.currentIndex = this.allDates.length - 1;
                    this.isPlaying = false;
                }
                this.updateBubbleSizes();
            }
            
            // Smooth bubble size transitions
            Object.keys(this.assets).forEach(function(key) {
                var asset = self.assets[key];
                asset.currentSize = asset.currentSize + (asset.targetSize - asset.currentSize) * self.LERP_FACTOR;
            });
            
            // Draw bubbles
            this.hoveredBubble = null;
            Object.keys(this.assets).forEach(function(key) {
                if (self.assets[key].enabled) {
                    self.drawBubble(p, self.assets[key]);
                }
            });
            
            // Draw UI
            this.drawTimeline(p, manager);
            this.drawControls(p, manager);
            this.drawInfoPanel(p, manager);
            
            // Draw tooltip
            if (this.hoveredBubble) {
                this.drawTooltip(p, this.hoveredBubble);
            }
        },

        drawBubble: function(p, asset) {
            if (!asset.hasData) return;
            
            var size = asset.currentSize;
            var d = p.dist(p.mouseX, p.mouseY, asset.x, asset.y);
            var isHovered = d < size / 2;
            
            if (isHovered) {
                this.hoveredBubble = asset;
            }
            
            // Draw glow effect
            p.drawingContext.shadowBlur = isHovered ? 40 : 20;
            p.drawingContext.shadowColor = asset.color;
            
            // Draw bubble
            p.fill(asset.color);
            p.noStroke();
            p.circle(asset.x, asset.y, size);
            
            // Reset shadow
            p.drawingContext.shadowBlur = 0;
            
            // Draw label
            p.fill(255);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(isHovered ? 18 : 14);
            p.textStyle(p.BOLD);
            p.text(asset.name, asset.x, asset.y);
            
            // Draw daily change percentage
            if (asset.currentData) {
                var changeVal = asset.currentData.changePercent;
                p.textSize(isHovered ? 16 : 12);
                p.textStyle(p.NORMAL);
                var sign = changeVal >= 0 ? '+' : '';
                var changeColor = changeVal >= 0 ? '#2ECC71' : '#E74C3C';
                p.fill(changeColor);
                p.text(sign + changeVal.toFixed(2) + '%', asset.x, asset.y + 20);
            }
        },

        drawTimeline: function(p, manager) {
            var sliderX = 100;
            var sliderY = manager.canvasHeight - 60; // Moved up from -80 for better spacing
            var sliderWidth = manager.canvasWidth - 200;
            var sliderHeight = 10;
            
            // Slider background
            p.fill(60, 65, 80);
            p.noStroke();
            p.rect(sliderX, sliderY, sliderWidth, sliderHeight, 5);
            
            // Progress bar
            var progress = this.currentIndex / (this.allDates.length - 1);
            p.fill(100, 150, 255);
            p.rect(sliderX, sliderY, sliderWidth * progress, sliderHeight, 5);
            
            // Slider handle
            var handleX = sliderX + sliderWidth * progress;
            p.fill(255);
            p.circle(handleX, sliderY + sliderHeight / 2, 20);
            
            // Date labels
            p.fill(200);
            p.textSize(12);
            p.textAlign(p.LEFT, p.TOP);
            if (this.earliestDate) {
                p.text(this.formatDate(this.earliestDate), sliderX, sliderY + 20);
            }
            p.textAlign(p.RIGHT, p.TOP);
            if (this.latestDate) {
                p.text(this.formatDate(this.latestDate), sliderX + sliderWidth, sliderY + 20);
            }
            
            // Current date - with background for visibility
            if (this.allDates[this.currentIndex]) {
                var dateText = this.formatDate(this.allDates[this.currentIndex]);
                p.textSize(16);
                var textW = p.textWidth(dateText);
                
                // Dark background box
                p.fill(0, 0, 0, 180);
                p.noStroke();
                p.rect(manager.canvasWidth / 2 - textW / 2 - 10, sliderY + 15, textW + 20, 25, 5);
                
                // White text
                p.fill(255);
                p.textAlign(p.CENTER, p.TOP);
                p.text(dateText, manager.canvasWidth / 2, sliderY + 20);
            }
            
            // Event markers
            var self = this;
            this.events.forEach(function(event) {
                var eventDate = self.parseDate(event.date);
                var eventIndex = -1;
                for (var i = 0; i < self.allDates.length; i++) {
                    var d = self.allDates[i];
                    if (d.getFullYear() === eventDate.getFullYear() &&
                        d.getMonth() === eventDate.getMonth() &&
                        d.getDate() === eventDate.getDate()) {
                        eventIndex = i;
                        break;
                    }
                }
                
                if (eventIndex >= 0) {
                    var eventX = sliderX + sliderWidth * (eventIndex / (self.allDates.length - 1));
                    p.stroke(event.color);
                    p.strokeWeight(2);
                    p.line(eventX, sliderY - 10, eventX, sliderY + sliderHeight + 10);
                }
            });
        },

        drawControls: function(p, manager) {
            // Play/Pause button
            var buttonX = 40;
            var buttonY = manager.canvasHeight - 60 + 5; // Updated to match new slider position
            var buttonSize = 30;
            
            p.fill(100, 150, 255);
            p.noStroke();
            p.circle(buttonX, buttonY, buttonSize);
            
            p.fill(255);
            if (this.isPlaying) {
                p.rect(buttonX - 5, buttonY - 7, 3, 14);
                p.rect(buttonX + 2, buttonY - 7, 3, 14);
            } else {
                p.triangle(buttonX - 4, buttonY - 7, buttonX - 4, buttonY + 7, buttonX + 6, buttonY);
            }
            
            // Asset toggles with header
            var toggleStartY = 30;
            var toggleSpacing = 35;
            var toggleX = manager.canvasWidth - 140;
            var self = this;
            
            // Header to clarify these are interactive controls
            p.fill(200);
            p.noStroke();
            p.textAlign(p.LEFT, p.TOP);
            p.textSize(11);
            p.textStyle(p.BOLD);
            p.text('FILTER ASSETS:', toggleX, toggleStartY - 20);
            
            p.textAlign(p.LEFT, p.CENTER);
            p.textSize(14);
            p.textStyle(p.NORMAL);
            
            Object.keys(this.assets).forEach(function(key, i) {
                var asset = self.assets[key];
                var toggleY = toggleStartY + i * toggleSpacing;
                
                // Hover effect
                var isHovered = p.mouseX >= toggleX - 5 && p.mouseX <= toggleX + 120 &&
                                p.mouseY >= toggleY - 12 && p.mouseY <= toggleY + 12;
                
                if (isHovered) {
                    p.fill(255, 255, 255, 20);
                    p.noStroke();
                    p.rect(toggleX - 5, toggleY - 12, 125, 24, 3);
                }
                
                // Checkbox
                p.stroke(asset.color);
                p.strokeWeight(2);
                if (asset.enabled) {
                    p.fill(asset.color);
                } else {
                    p.noFill();
                }
                p.rect(toggleX, toggleY - 8, 16, 16, 3);
                
                // Checkmark when enabled
                if (asset.enabled) {
                    p.stroke(255);
                    p.strokeWeight(2);
                    p.noFill();
                    p.line(toggleX + 3, toggleY, toggleX + 6, toggleY + 4);
                    p.line(toggleX + 6, toggleY + 4, toggleX + 13, toggleY - 5);
                }
                
                // Label
                p.fill(asset.enabled ? 255 : 150);
                p.noStroke();
                p.text(asset.name, toggleX + 25, toggleY);
            });
        },

        drawInfoPanel: function(p, manager) {
            if (!this.allDates[this.currentIndex]) return;
            
            var self = this;
            this.events.forEach(function(event) {
                var eventDate = self.parseDate(event.date);
                var daysDiff = Math.abs((self.allDates[self.currentIndex] - eventDate) / (1000 * 60 * 60 * 24));
                
                if (daysDiff < 7) {
                    p.fill(0, 0, 0, 200);
                    p.noStroke();
                    p.rect(manager.canvasWidth / 2 - 200, 20, 400, 40, 5);
                    
                    p.fill(event.color);
                    p.textAlign(p.CENTER, p.CENTER);
                    p.textSize(14);
                    p.textStyle(p.BOLD);
                    p.text('⚠ ' + event.name, manager.canvasWidth / 2, 40);
                }
            });
        },

        drawTooltip: function(p, asset) {
            var tooltipWidth = 220;
            var tooltipHeight = 100;
            var tooltipX = p.mouseX + 15;
            var tooltipY = p.mouseY - tooltipHeight / 2;
            
            if (tooltipX + tooltipWidth > p.width) {
                tooltipX = p.mouseX - tooltipWidth - 15;
            }
            
            p.fill(0, 0, 0, 230);
            p.stroke(asset.color);
            p.strokeWeight(2);
            p.rect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 5);
            
            p.noStroke();
            p.fill(255);
            p.textAlign(p.LEFT, p.TOP);
            p.textSize(14);
            p.textStyle(p.BOLD);
            p.text(asset.name, tooltipX + 10, tooltipY + 10);
            
            p.textStyle(p.NORMAL);
            p.textSize(12);
            
            if (asset.currentData) {
                p.fill(255);
                p.text('Price: $' + asset.currentData.price.toLocaleString(), tooltipX + 10, tooltipY + 35);
                
                var changeVal = asset.currentData.changePercent;
                var changeText = (changeVal >= 0 ? '+' : '') + changeVal.toFixed(2) + '%';
                p.fill(changeVal >= 0 ? '#2ECC71' : '#E74C3C');
                p.text('Daily Change: ' + changeText, tooltipX + 10, tooltipY + 55);
                
                p.fill(180);
                p.textSize(10);
                p.text(asset.currentData.dateStr, tooltipX + 10, tooltipY + 75);
            }
        },

        formatDate: function(date) {
            var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
        },

        handleMousePressed: function(p, manager) {
            var sliderX = 100;
            var sliderY = manager.canvasHeight - 60; // Updated to match new position
            var sliderWidth = manager.canvasWidth - 200;
            var sliderHeight = 10;
            
            // Check play button - increased click radius for better usability
            var buttonX = 40;
            var buttonY = sliderY + 5;
            var buttonSize = 30;
            
            console.log('VizBubbles mousePressed:', { mouseX: p.mouseX, mouseY: p.mouseY, buttonX: buttonX, buttonY: buttonY, dist: p.dist(p.mouseX, p.mouseY, buttonX, buttonY), threshold: buttonSize / 2 + 5 });
            
            // Increased click radius from buttonSize/2 to buttonSize/2 + 5
            if (p.dist(p.mouseX, p.mouseY, buttonX, buttonY) < buttonSize / 2 + 5) {
                this.isPlaying = !this.isPlaying;
                console.log('VizBubbles: play/pause toggled, isPlaying:', this.isPlaying);
                return true;
            }
            
            // Check slider
            if (p.mouseX >= sliderX && p.mouseX <= sliderX + sliderWidth &&
                p.mouseY >= sliderY - 10 && p.mouseY <= sliderY + sliderHeight + 10) {
                this.isDraggingSlider = true;
                this.updateSliderPosition(p, manager);
                return true;
            }
            
            // Check asset toggles
            var toggleStartY = 30;
            var toggleSpacing = 35;
            var toggleX = manager.canvasWidth - 140;
            var self = this;
            
            var toggled = false;
            Object.keys(this.assets).forEach(function(key, i) {
                var toggleY = toggleStartY + i * toggleSpacing;
                
                if (p.mouseX >= toggleX && p.mouseX <= toggleX + 16 &&
                    p.mouseY >= toggleY - 8 && p.mouseY <= toggleY + 8) {
                    self.assets[key].enabled = !self.assets[key].enabled;
                    toggled = true;
                }
            });
            
            return toggled;
        },

        handleMouseDragged: function(p, manager) {
            if (this.isDraggingSlider) {
                this.updateSliderPosition(p, manager);
                return true;
            }
            return false;
        },

        handleMouseReleased: function(p, manager) {
            if (this.isDraggingSlider) {
                this.isDraggingSlider = false;
                return true;
            }
            return false;
        },

        updateSliderPosition: function(p, manager) {
            var sliderX = 100;
            var sliderWidth = manager.canvasWidth - 200;
            var progress = Math.max(0, Math.min(1, (p.mouseX - sliderX) / sliderWidth));
            this.currentIndex = Math.floor(progress * (this.allDates.length - 1));
            this.updateBubbleSizes();
        }
    };
})();
