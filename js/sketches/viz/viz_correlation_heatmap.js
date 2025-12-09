// viz_correlation_heatmap.js
// Correlation heatmap showing relationships between the 5 assets

(function() {
    window.VizCorrelationHeatmap = {
        assets: {
            bitcoin: { name: 'Bitcoin', file: 'data/Bitcoin Historical Data.csv', color: '#F7931A', data: [], monthlyReturns: [] },
            sp500: { name: 'S&P 500', file: 'data/S&P 500 Historical Data.csv', color: '#4169E1', data: [], monthlyReturns: [] },
            gold: { name: 'Gold', file: 'data/Gold Futures Historical Data.csv', color: '#FFD700', data: [], monthlyReturns: [] },
            oil: { name: 'Oil', file: 'data/Crude Oil WTI Futures Historical Data.csv', color: '#2C2C2C', data: [], monthlyReturns: [] },
            usd: { name: 'USD Index', file: 'data/US Dollar Index Historical Data.csv', color: '#2ECC71', data: [], monthlyReturns: [] }
        },
        
        dataLoaded: false,
        correlationMatrix: null,
        assetKeys: ['bitcoin', 'sp500', 'gold', 'oil', 'usd'],
        hoveredCell: null,

        parseDate: function(dateStr) {
            var parts = dateStr.replace(/\"/g, '').split('/');
            return new Date(parts[2], parts[0] - 1, parts[1]);
        },

        parseTable: function(table) {
            var rows = [];
            for (var i = 0; i < table.getRowCount(); i++) {
                var dateStr = table.getString(i, 'Date');
                var priceStr = table.getString(i, 'Price').replace(/,/g, '');
                rows.push({
                    date: this.parseDate(dateStr),
                    dateStr: dateStr,
                    price: parseFloat(priceStr)
                });
            }
            return rows.reverse();
        },

        loadData: function(p) {
            var self = this;
            var keys = this.assetKeys;
            var loaded = 0;
            var total = keys.length;

            keys.forEach(function(key) {
                var asset = self.assets[key];
                p.loadTable(asset.file, 'csv', 'header', function(table) {
                    asset.data = self.parseTable(table);
                    loaded++;
                    if (loaded === total) {
                        self.processMonthlyReturns();
                        self.calculateCorrelations();
                        self.dataLoaded = true;
                    }
                });
            });
        },

        processMonthlyReturns: function() {
            var self = this;
            
            this.assetKeys.forEach(function(key) {
                var asset = self.assets[key];
                var monthlyData = {};
                
                // Group by year-month
                asset.data.forEach(function(d) {
                    var yearMonth = d.date.getFullYear() + '-' + (d.date.getMonth() + 1);
                    if (!monthlyData[yearMonth]) {
                        monthlyData[yearMonth] = { first: d.price, last: d.price, date: d.date };
                    }
                    monthlyData[yearMonth].last = d.price;
                });
                
                // Calculate monthly returns
                var sortedMonths = Object.keys(monthlyData).sort();
                asset.monthlyReturns = sortedMonths.map(function(month) {
                    var data = monthlyData[month];
                    var ret = (data.last - data.first) / data.first;
                    return { date: data.date, return: ret };
                });
            });
        },

        calculateCorrelations: function() {
            var self = this;
            var n = this.assetKeys.length;
            this.correlationMatrix = [];
            
            // Initialize matrix
            for (var i = 0; i < n; i++) {
                this.correlationMatrix[i] = [];
                for (var j = 0; j < n; j++) {
                    this.correlationMatrix[i][j] = 0;
                }
            }
            
            // Calculate correlations
            for (var i = 0; i < n; i++) {
                for (var j = 0; j < n; j++) {
                    if (i === j) {
                        this.correlationMatrix[i][j] = 1;
                    } else {
                        var asset1 = this.assets[this.assetKeys[i]];
                        var asset2 = this.assets[this.assetKeys[j]];
                        this.correlationMatrix[i][j] = this.pearsonCorrelation(
                            asset1.monthlyReturns,
                            asset2.monthlyReturns
                        );
                    }
                }
            }
        },

        pearsonCorrelation: function(returns1, returns2) {
            // Align dates
            var aligned = [];
            var map1 = {};
            returns1.forEach(function(r) {
                var key = r.date.getFullYear() + '-' + r.date.getMonth();
                map1[key] = r.return;
            });
            
            returns2.forEach(function(r) {
                var key = r.date.getFullYear() + '-' + r.date.getMonth();
                if (map1[key] !== undefined) {
                    aligned.push({ x: map1[key], y: r.return });
                }
            });
            
            if (aligned.length < 2) return 0;
            
            // Calculate means
            var sumX = 0, sumY = 0;
            aligned.forEach(function(p) {
                sumX += p.x;
                sumY += p.y;
            });
            var meanX = sumX / aligned.length;
            var meanY = sumY / aligned.length;
            
            // Calculate correlation
            var numerator = 0;
            var denomX = 0;
            var denomY = 0;
            
            aligned.forEach(function(p) {
                var dx = p.x - meanX;
                var dy = p.y - meanY;
                numerator += dx * dy;
                denomX += dx * dx;
                denomY += dy * dy;
            });
            
            if (denomX === 0 || denomY === 0) return 0;
            return numerator / Math.sqrt(denomX * denomY);
        },

        hexToRgb: function(hex) {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        },

        blendColors: function(color1, color2, weight) {
            // weight 0-1, 0.5 = equal mix
            var c1 = this.hexToRgb(color1);
            var c2 = this.hexToRgb(color2);
            return {
                r: Math.round(c1.r * (1 - weight) + c2.r * weight),
                g: Math.round(c1.g * (1 - weight) + c2.g * weight),
                b: Math.round(c1.b * (1 - weight) + c2.b * weight)
            };
        },

        getCellColor: function(i, j, corr) {
            // For diagonal, use the asset's own color
            if (i === j) {
                return this.hexToRgb(this.assets[this.assetKeys[i]].color);
            }
            
            // For off-diagonal, blend the two asset colors based on correlation strength
            var asset1Color = this.assets[this.assetKeys[i]].color;
            var asset2Color = this.assets[this.assetKeys[j]].color;
            
            // Blend 50/50 for the base color
            return this.blendColors(asset1Color, asset2Color, 0.5);
        },

        draw: function(p, manager, ai, progress) {
            var self = this;
            
            if (!this.dataLoaded) {
                this.loadData(p);
                p.fill(0);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(24);
                p.text('Loading correlation data...', manager.canvasWidth / 2, manager.canvasHeight / 2);
                return;
            }
            
            var cellSize = 100;
            var matrixSize = this.assetKeys.length;
            var totalWidth = cellSize * matrixSize;
            var totalHeight = cellSize * matrixSize;
            
            var startX = (manager.canvasWidth - totalWidth) / 2;
            var startY = 120; // Increased from 80 to prevent title overlap
            
            // Title
            p.fill(0);
            p.noStroke();
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(24);
            p.textStyle(p.BOLD);
            p.text('Asset Correlation Matrix', manager.canvasWidth / 2, 20);
            p.textSize(13);
            p.textStyle(p.NORMAL);
            p.fill(80);
            p.text('12-year monthly returns (2013-2025)', manager.canvasWidth / 2, 52);
            p.textSize(12);
            p.fill(100);
            p.text('Green = move together  •  Red = move opposite  •  Darker = stronger', manager.canvasWidth / 2, 72);
            
            this.hoveredCell = null;
            
            // Draw cells
            for (var i = 0; i < matrixSize; i++) {
                for (var j = 0; j < matrixSize; j++) {
                    var x = startX + j * cellSize;
                    var y = startY + i * cellSize;
                    var corr = this.correlationMatrix[i][j];
                    
                    // Check hover
                    var isHovered = p.mouseX >= x && p.mouseX < x + cellSize &&
                                   p.mouseY >= y && p.mouseY < y + cellSize;
                    
                    if (isHovered) {
                        this.hoveredCell = {
                            i: i,
                            j: j,
                            corr: corr,
                            asset1: this.assets[this.assetKeys[i]].name,
                            asset2: this.assets[this.assetKeys[j]].name
                        };
                    }
                    
                    // Draw cell background with simple color scale
                    if (i === j) {
                        // Diagonal - light grey
                        p.fill(220);
                    } else {
                        // Off-diagonal - green for positive, red for negative, intensity based on strength
                        var strength = Math.abs(corr);
                        if (corr >= 0) {
                            // Positive correlation: white to green (#2ECC71)
                            var greenIntensity = Math.floor(strength * 255);
                            var r = 255 - Math.floor(greenIntensity * (255 - 46) / 255);
                            var g = 255 - Math.floor(greenIntensity * (255 - 204) / 255);
                            var b = 255 - Math.floor(greenIntensity * (255 - 113) / 255);
                            p.fill(r, g, b);
                        } else {
                            // Negative correlation: white to red (#E74C3C)
                            var redIntensity = Math.floor(strength * 255);
                            var r = 255 - Math.floor(redIntensity * (255 - 231) / 255);
                            var g = 255 - Math.floor(redIntensity * (255 - 76) / 255);
                            var b = 255 - Math.floor(redIntensity * (255 - 60) / 255);
                            p.fill(r, g, b);
                        }
                    }
                    
                    p.stroke(255);
                    p.strokeWeight(2);
                    p.rect(x, y, cellSize, cellSize);
                    
                    // Draw correlation value
                    if (i === j) {
                        p.fill(100); // Dark grey for diagonal
                    } else {
                        // Dark text for light cells, light text for dark cells
                        var strength = Math.abs(corr);
                        p.fill(strength > 0.6 ? 255 : 0);
                    }
                    p.noStroke();
                    p.textAlign(p.CENTER, p.CENTER);
                    p.textSize(16);
                    p.textStyle(p.BOLD);
                    p.text(corr.toFixed(2), x + cellSize / 2, y + cellSize / 2);
                }
            }
            
            // Draw labels
            p.fill(0);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(12);
            p.textStyle(p.NORMAL);
            
            // Column labels (top)
            for (var j = 0; j < matrixSize; j++) {
                var x = startX + j * cellSize + cellSize / 2;
                var y = startY - 15;
                p.text(this.assets[this.assetKeys[j]].name, x, y);
            }
            
            // Row labels (left)
            for (var i = 0; i < matrixSize; i++) {
                var x = startX - 10;
                var y = startY + i * cellSize + cellSize / 2;
                p.textAlign(p.RIGHT, p.CENTER);
                p.text(this.assets[this.assetKeys[i]].name, x, y);
            }
            
            // Hover tooltip
            if (this.hoveredCell && this.hoveredCell.i !== this.hoveredCell.j) {
                var tooltipX = p.mouseX + 15;
                var tooltipY = p.mouseY - 40;
                var tooltipW = 180;
                var tooltipH = 60;
                
                // Adjust position if near edge
                if (tooltipX + tooltipW > manager.canvasWidth) {
                    tooltipX = p.mouseX - tooltipW - 15;
                }
                
                p.fill(255, 255, 255, 240);
                p.stroke(0);
                p.strokeWeight(1);
                p.rect(tooltipX, tooltipY, tooltipW, tooltipH, 5);
                
                p.fill(0);
                p.noStroke();
                p.textAlign(p.LEFT, p.TOP);
                p.textSize(11);
                p.textStyle(p.BOLD);
                p.text(this.hoveredCell.asset1 + ' vs ' + this.hoveredCell.asset2, 
                       tooltipX + 10, tooltipY + 8);
                p.textStyle(p.NORMAL);
                p.text('Correlation: ' + this.hoveredCell.corr.toFixed(3), 
                       tooltipX + 10, tooltipY + 25);
                
                var interpretation = '';
                if (Math.abs(this.hoveredCell.corr) < 0.3) {
                    interpretation = 'Weak relationship';
                } else if (Math.abs(this.hoveredCell.corr) < 0.7) {
                    interpretation = 'Moderate relationship';
                } else {
                    interpretation = 'Strong relationship';
                }
                p.text(interpretation, tooltipX + 10, tooltipY + 40);
            }
        }
    };
})();
