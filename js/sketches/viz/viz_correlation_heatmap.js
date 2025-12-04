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

        getColorForCorrelation: function(corr, alpha) {
            // Blue for positive, red for negative
            if (corr > 0) {
                var intensity = Math.floor(corr * 200);
                return 'rgba(65, 105, 225, ' + (alpha || 1) + ')'; // Royal blue
            } else {
                var intensity = Math.floor(Math.abs(corr) * 200);
                return 'rgba(220, 20, 60, ' + (alpha || 1) + ')'; // Crimson
            }
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
            var startY = 80;
            
            // Title
            p.fill(0);
            p.noStroke();
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(20);
            p.textStyle(p.BOLD);
            p.text('Asset Correlation Matrix', manager.canvasWidth / 2, 20);
            p.textSize(14);
            p.textStyle(p.NORMAL);
            p.text('(12-year monthly returns)', manager.canvasWidth / 2, 48);
            
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
                    
                    // Draw cell background
                    if (i === j) {
                        // Diagonal - grey
                        p.fill(200);
                    } else {
                        // Correlation color
                        var alpha = Math.abs(corr);
                        if (corr > 0) {
                            p.fill(65, 105, 225, alpha * 255);
                        } else {
                            p.fill(220, 20, 60, Math.abs(corr) * 255);
                        }
                    }
                    
                    p.stroke(255);
                    p.strokeWeight(2);
                    p.rect(x, y, cellSize, cellSize);
                    
                    // Draw correlation value
                    p.fill(i === j ? 100 : 255);
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
            
            // Legend
            var legendY = startY + totalHeight + 40;
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(13);
            p.textStyle(p.ITALIC);
            p.fill(0);
            p.text('Blue = Positive Correlation  |  Red = Negative Correlation  |  Darker = Stronger', 
                   manager.canvasWidth / 2, legendY);
            
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
