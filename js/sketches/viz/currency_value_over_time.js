(function() {
    window.CurrencyValueOverTime = {
        assets: {
            bitcoin: { 
                name: 'Bitcoin', 
                data: [], 
                hasData: false,
                scale: 20000
            },
            sp500: { 
                name: 'S&P 500', 
                data: [], 
                hasData: false,
                scale: 650
            },
            gold: { 
                name: 'Gold', 
                data: [], 
                hasData: false,
                scale: 130
            },
            oil: { 
                name: 'Oil',  
                data: [], 
                hasData: false,
                scale: 20
            },
            usd: { 
                name: 'USD Index',  
                data: [], 
                hasData: false,
                scale: 5
            }
        },

        events: [
            { date: '03/11/2020', name: 'COVID-19 Pandemic Declared' },
            { date: '03/23/2020', name: 'Market Bottom (COVID)' },
            { date: '01/06/2021', name: 'US Capitol Attack' },
            { date: '02/24/2022', name: 'Ukraine War Begins' },
            { date: '03/10/2023', name: 'Silicon Valley Bank Collapse' }
        ],
        
        dataLoaded: false,

        timeTicks: [],
        bars: [],

        assetKeys: null,
        selectedAsset: null,

        dropdownOpen: false,
        dropdownX: 20,
        dropdownY: 20,
        dropdownW: 200,
        dropdownH: 30,

        preload: function(p, manager) {
            if (!this.dataLoaded && Object.keys(this.assets).every(key => this.assets[key].data.length === 0)) {
                this.loadData(p, manager);
            }

            this.assetKeys = Object.keys(this.assets);
            this.selectedAsset = this.assetKeys[0];
        },

        loadData: function(p, manager) {
            var self = this;
            var loadedCount = 0;
            var totalFiles = 5;

            function checkAllLoaded() {
                loadedCount++;
                if (loadedCount === totalFiles) {
                    self.dataLoaded = true;
                }
            }

            p.loadTable('data/Bitcoin-Historical-Data-Monthly.csv', 'csv', 'header', (table) => {
                this.assets.bitcoin.data = this.parseTable(table);
                checkAllLoaded();
            });
            p.loadTable('data/S&P-500-Historical-Data-Monthly.csv', 'csv', 'header', (table) => {
                this.assets.sp500.data = this.parseTable(table);
                checkAllLoaded();
            });
            p.loadTable('data/Gold-Historical-Data-Monthly.csv', 'csv', 'header', (table) => {
                this.assets.gold.data = this.parseTable(table);
                checkAllLoaded();
            });
            p.loadTable('data/Crude-Oil-Historical-Data-Monthly.csv', 'csv', 'header', (table) => {
                this.assets.oil.data = this.parseTable(table);
                checkAllLoaded();
            });
            p.loadTable('data/US-Dollar-Historical-Data-Monthly.csv', 'csv', 'header', (table) => {
                this.assets.usd.data = this.parseTable(table);
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

        draw: function (p, manager, ai, progress) {
            if (!this.dataLoaded) {
                this.preload(p, manager);
                p.fill(255);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(24);
                p.text('Loading data...', manager.canvasWidth / 2, manager.canvasHeight / 2);
                return;
            }

            
            this.drawTimeLine(p, manager);
            this.drawTimeTicks(p, manager);
            this.drawBars(p, manager);
            this.drawDropDown(p, manager);
            this.drawTitle(p, manager);
            this.drawScale(p, manager);
        },

        drawTimeLine: function(p, manager) {
            var x = manager.canvasWidth / 2;
            var y = manager.canvasHeight / 2;

            p.stroke(0);
            p.strokeWeight(1);
            p.line(x - 550, y, x + 350, y);
            p.line(x - 550, y - 15, x - 550, y + 15);
            p.line(x + 350, y - 15, x + 350, y + 15);
        },

        generateTicks: function(p, manager) {
            const dataCount = this.assets[this.selectedAsset].data.length;
            const startX = manager.canvasWidth / 2 - 550;
            const endX = manager.canvasWidth / 2 + 350;
            const totalWidth = endX - startX;

            for (let i = 0; i < dataCount; i++) {
                const t = i / (dataCount - 1);
                const x = startX + t * totalWidth;

                this.timeTicks.push(x);
            }
        },

        drawTimeTicks: function(p, manager) {
            if (!this.timeTicks || this.timeTicks.length === 0) {
                this.generateTicks(p, manager);
            }

            const y = manager.canvasHeight / 2;

            for (let i = 0; i < this.timeTicks.length; i++) {
                let tickX = this.timeTicks[i];

                p.stroke(0);
                p.strokeWeight(1);
                p.line(tickX, y - 7, tickX, y + 7);
            }

            p.strokeWeight(0);
            p.textSize(15);
            p.text("Jan,", manager.canvasWidth / 2 - 575, manager.canvasHeight / 2 - 10)
            p.text("2013", manager.canvasWidth / 2 - 575, manager.canvasHeight / 2 + 10)
            p.text("Nov,", manager.canvasWidth / 2 + 372, manager.canvasHeight / 2 - 10)
            p.text("2025", manager.canvasWidth / 2 + 372, manager.canvasHeight / 2 + 10)
        },

        drawBars: function(p, manager) {
            const asset = this.assets[this.selectedAsset]
            const data = asset.data;
            const y = manager.canvasHeight / 2;

            for (let i = 0; i < data.length - 1; i++) {
                const x1 = this.timeTicks[i];
                const x2 = this.timeTicks[i + 1];
                const midX = (x1 + x2) / 2;

                const priceNow = data[i].price;
                const priceNext = data[i + 1].price;
                const change = priceNext - priceNow;

                const barLength = p.map(Math.abs(change), 0, asset.scale, 0, 300);

                p.stroke(change >= 0 ? 'green' : 'red');
                p.strokeWeight(4);

                p.line(midX, y, midX, y - barLength * Math.sign(change));
            }
        },

        drawDropDown: function(p, manager) {   
            // Draw dropdown box
            p.fill(255);
            p.stroke(0);
            p.strokeWeight(1);
            p.rect(this.dropdownX, this.dropdownY, 200, 30);

            // Selected text
            p.fill(0);
            p.textAlign(p.LEFT, p.CENTER);
            p.textSize(16);
            p.strokeWeight(1);
            p.text(this.assets[this.selectedAsset].name, this.dropdownX + 10, this.dropdownY + this.dropdownH/2);

            if (this.dropdownOpen) {
                for (let i = 0; i < this.assetKeys.length; i++) {
                    let y = this.dropdownY + this.dropdownH * (i + 1);

                    p.fill(240);
                    p.strokeWeight(1);
                    p.rect(this.dropdownX, y, this.dropdownW, this.dropdownH);

                    p.fill(0);
                    p.strokeWeight(1);
                    p.text(this.assets[this.assetKeys[i]].name, this.dropdownX + 10, y + this.dropdownH/2);
                }
            }

            // Interaction
            p.mousePressed = () => {
                // Click on dropdown header
                if (p.mouseX > this.dropdownX && p.mouseX < this.dropdownX + this.dropdownW &&
                    p.mouseY > this.dropdownY && p.mouseY < this.dropdownY + this.dropdownH) {
                    this.dropdownOpen = !this.dropdownOpen;
                    return;
                }

                // Click on one of the items
                if (this.dropdownOpen) {
                    for (let i = 0; i < this.assetKeys.length; i++) {
                        let y = this.dropdownY + this.dropdownH * (i + 1);

                        if (p.mouseX > this.dropdownX && p.mouseX < this.dropdownX + this.dropdownW &&
                            p.mouseY > y && p.mouseY < y + this.dropdownH) {

                            this.selectedAsset = this.assetKeys[i];
                            this.dropdownOpen = false;
                            return;
                        }
                    }
                }

                dropdownOpen = false;
            };
        },

        drawTitle: function(p, manager) {
            p.fill(0);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(24);
            p.text('Asset Change Over Time', manager.canvasWidth / 2 - 100, 40);
        },

        drawScale: function(p, manager) {
            p.strokeWeight(1);
            p.stroke(0);
            p.line(manager.canvasWidth / 2 - 150 - 100, manager.canvasHeight / 2 + 295, manager.canvasWidth / 2 + 150 - 100, manager.canvasHeight / 2 + 295);
            p.line(manager.canvasWidth / 2 - 150 - 100, manager.canvasHeight / 2 + 290, manager.canvasWidth / 2 - 150 - 100, manager.canvasHeight / 2 + 300);
            p.line(manager.canvasWidth / 2 + 150 - 100, manager.canvasHeight / 2 + 290, manager.canvasWidth / 2 + 150 - 100, manager.canvasHeight / 2 + 300);

            p.textAlign(p.CENTER, p.CENTER);
            p.fill(0);
            p.strokeWeight(0);
            p.textSize(12);
            p.text('Scale: ' + this.assets[this.selectedAsset].scale + ' USD', manager.canvasWidth / 2 - 100, manager.canvasHeight / 2 + 280);
        }
    }
})();