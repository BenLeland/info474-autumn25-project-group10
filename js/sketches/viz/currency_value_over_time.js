(function() {
    window.CurrencyValueOverTime = {
        assets: {
            bitcoin: { 
                name: 'Bitcoin', 
                data: [], 
                hasData: false
            },
            sp500: { 
                name: 'S&P 500', 
                data: [], 
                hasData: false
            },
            gold: { 
                name: 'Gold', 
                data: [], 
                hasData: false
            },
            oil: { 
                name: 'Oil',  
                data: [], 
                hasData: false
            },
            usd: { 
                name: 'USD Index',  
                data: [], 
                hasData: false
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

        preload: function(p, manager) {
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
                    self.dataLoaded = true;
                }
            }

            p.loadTable('data/Bitcoin-Historical-Data-Monthly.csv', 'csv', 'header', (table) => {
                this.assets.bitcoin.data = this.parseTable(table);
                checkAllLoaded();
            });
            p.loadTable('data/S&P 500 Historical Data.csv', 'csv', 'header', (table) => {
                this.assets.sp500.data = this.parseTable(table);
                checkAllLoaded();
            });
            p.loadTable('data/Gold Futures Historical Data.csv', 'csv', 'header', (table) => {
                this.assets.gold.data = this.parseTable(table);
                checkAllLoaded();
            });
            p.loadTable('data/Crude Oil WTI Futures Historical Data.csv', 'csv', 'header', (table) => {
                this.assets.oil.data = this.parseTable(table);
                checkAllLoaded();
            });
            p.loadTable('data/US Dollar Index Historical Data.csv', 'csv', 'header', (table) => {
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
            // drawBars(p);
            // drawEvents(p);
        },

        drawTimeLine: function(p, manager) {
            var x = manager.canvasWidth / 2;
            var y = manager.canvasHeight / 2;

            p.stroke(0);
            p.strokeWeight(1);
            p.line(x - 350, y, x + 275, y);
            p.line(x - 350, y - 15, x - 350, y + 15);
            p.line(x + 275, y - 15, x + 275, y + 15);
        },

        generateTicks: function(p, manager) {
            const dataCount = this.assets.bitcoin.data.length;
            const startX = manager.canvasWidth / 2 - 350;
            const endX = manager.canvasWidth / 2 + 275;
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
                p.line(tickX, y - 10, tickX, y + 10);
            }
        },

    //     populateBars: function(p) {
    //         for (let i = 0; i < timeTicks.length - 1; i++) {
    //             let x1 = timeTicks[i];
    //             let x2 = timeTicks[i + 1];
    //             let midX = (x1 + x2) / 2;

    //             let change = p.random(-20, 20);

    //             bars.push({x: midX, y: p.windowHeight / 2, change: change});
    //         }
    //     },

    //     drawBars: function(p) {
    //         for (let i = 0; i < bars.length; i++) {
    //             let bar = bars[i];
    //             let barLength = p.map(Math.abs(bar.change), 0, 20, 0, 300);

    //             p.stroke(bar.change >= 0 ? 'green' : 'red');
    //             p.strokeWeight(38);
    //             p.line(bar.x, bar.y, bar.x, bar.y - barLength * Math.sign(bar.change));
    //         }
    //     },

    //     populateEvents: function(p) {
    //         let count = Math.floor(p.random(3, 6));

    //         for (let i = 0; i < count; i++) {
    //             let x = timeTicks[Math.floor(p.random(timeTicks.length))];
    //             events.push({x: x, y: p.windowHeight / 2});
    //         }
    //     },

    //     drawEvents: function(p) {
    //         for (let i = 0; i < events.length; i++) {
    //             let event = events[i];
    //             p.fill(200)
    //             p.stroke(255);
    //             p.strokeWeight(1);
    //             p.circle(event.x, event.y, 8);
    //         }
    //     }
    }
})();