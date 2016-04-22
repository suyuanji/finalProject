var countries;
var table;
var wars = [];
var lastSelected;
var selected;
var hovered;
var bubbles = {};
var timelineDots = [];
var timeLine;
var slide = false;
var myCountries = [];

function preload() {
    table = loadTable("data/Inter-StateWarData_v4.0.csv", "csv", "header");
    countries = loadJSON("countryShape2.json");
}

function setup() {
    var cnv = createCanvas(windowWidth, windowHeight);
    cnv.mousePressed(timeLineSlideStart);
    cnv.mouseReleased(timeLineSlideEnd);
    table.getRows().forEach(function (row) {
        getWars(row);
    });
    getDots();
    createBubbles();
    timeLine = new TimeLine(this);
    countries.features.forEach(function (feature) {
        var myCountry = {};
        myCountry.name = feature.properties.NAME;
        if (feature.geometry != null) {

            if (feature.geometry.type == "Polygon") {
                myCountry.coordinates = feature.geometry.coordinates;
            } else if (feature.geometry.type == "MultiPolygon") {
                var myCountry = {};
                myCountry.coordinates = [];
                feature.geometry.coordinates.forEach(function (path) {
                    myCountry.coordinates.push(path[0]);
                });
            }
            myCountries.push(myCountry);
        }
    });
}

function draw() {
    background(255);
    fill('#a5a5a5')
    stroke(255);
    strokeWeight(0.5);
    countries.features.forEach(function (feature) {
        if (feature.geometry != null) {
            if (feature.geometry.type == "Polygon") {
                feature.geometry.coordinates.forEach(function (path) {
                    beginShape();
                    path.forEach(function (vertice) {
                        mercator(vertice[1], vertice[0]);
                    });
                    endShape();
                });

            } else if (feature.geometry.type == "MultiPolygon") {
                feature.geometry.coordinates.forEach(function (path) {
                    beginShape();
                    path[0].forEach(function (vertice) {
                        mercator(vertice[1], vertice[0]);
                    });
                    endShape();
                });
            }
        }
    });
    timeLine.draw();
    timeLine.updateSlideDot(timeLineSlide())
    //drawLegend();
    drawBubbles(timeLine.slideDot.decade, this);
    hovered = false;
}


//function drawLegend() {
//    var arr = [
//      {
//            text: 'Winner',
//            color: '#F11B82'
//        },
//        {
//            text: 'Loser',
//            color: '#1a87a7'
//        },
//        {
//            text: 'Compromise/Tied',
//            color: '#6bc375'
//        },
//        {
//            text: 'The war was transformed' + '\n' + 'into another type of war',
//            color: '#ffdf00'
//        }
//    ];
//
//    arr.forEach(function (e, i) {
//        textAlign(LEFT);
//        fill(e.color);
//        noStroke();
//        ellipse(20, 50 + i * 20, 10, 10);
//        text(e.text, 40, 55 + i * 20);
//    });
//}

var TimelineDot = function (decade) {
    this.decade = decade;
    this.count = 0;
    this.wars = [];
    this.index = 0;
    this.position = {};
    this.active = false;
    this.selected = false;
}
TimelineDot.prototype = {
    addWar: function (war) {
        this.wars.push(war);
        this.count++;
    }
}

function TimeLine(ctx) {
    this.ctx = ctx;
    this.width = this.ctx.width;
    this.height = this.ctx.height;
    this.thickness = 4;
    this.gap = 40;
    this.bottom = 50;
    this.x = 0;
    this.y = this.height - this.bottom;
    this.lineY = this.y + this.thickness / 2;
    this.slideDot = {};
    this.timelineDots = timelineDots;
    this.interval = (this.width - this.gap * 2) / (this.timelineDots.length);
    this.initSlideDot();
}
TimeLine.prototype = {
    initSlideDot: function () {
        this.slideDot = {
            paddingX: 0,
            width: 30,
            height: 8,
            x: 10,
            y: this.lineY - 4,
            radius: 6,
            year: 0,
            decade: 0,
            startDecade: 182
        }
    },
    draw: function () {
        var that = this;
        this.ctx.fill('#F11B82');
        this.ctx.noStroke();
        this.ctx.rect(this.x, this.y, this.width, this.thickness);
        this.timelineDots.forEach(function (e, i) {
            var decade = e.decade * 10;
            that.ctx.ellipse(that.gap + that.interval * i, that.lineY, 15, 15);
            that.ctx.textAlign(CENTER);
            if (decade == that.slideDot.decade * 10 || decade == (that.slideDot.decade + 1) * 10) {
                that.ctx.textSize(15);
                that.ctx.fill('rgba(209,177,32,1)');
            } else {
                that.ctx.textSize(10);
                that.ctx.fill('#F11B82');
            }
            that.ctx.text(decade, that.gap + that.interval * i, that.lineY - 20);
            that.ctx.fill('#F11B82');
        })
    },
    updateSlideDot: function (x) {
        if (slide) {
            this.slideDot.x = x - this.slideDot.paddingX;
            this.ctx.fill('rgba(209,177,32,1)');

        }
        if (!slide) {
            this.ctx.fill('rgba(209,177,32,0.8)');
            this.slideDot.paddingX = 0;
        }
        this.ctx.noStroke();
        this.ctx.rect(this.slideDot.x, this.slideDot.y, this.slideDot.width, this.slideDot.height, 6);
        if (this.slideDot.x - this.interval / 2 > 0) {
            this.slideDot.decade = this.slideDot.startDecade + ~~((this.slideDot.x + this.slideDot.width / 2 - this.gap + this.interval / 2) / this.interval);
        }
    },
    mousePosDetect: function () {
        var x = this.ctx.mouseX;
        var y = this.ctx.mouseY;
        if (this.slideDot.x > x) {
            return false
        }
        if (this.slideDot.x + this.slideDot.width < x) {
            return false
        }
        if (this.slideDot.y > y) {
            return false
        }
        if (this.slideDot.y + this.slideDot.height < y) {
            return false
        }
        this.slideDot.paddingX = x - this.slideDot.x;
        return true;
    }
}


function Bubble(option) {
    this.center = option.center;
    this.radius = option.radius;
    this.color = option.color;
    this.info = option.info;
    this.position = option.position;
    this.active = false;
    this.selected = false;
}
Bubble.prototype = {
    draw: function (ctx, countryCenter) {

        this.pixelPos = geo2pixel(ctx, countryCenter[0],countryCenter[1]);
        this.radius = 10 + sqrt(this.info.batDeath / 1000);
        this.radius > 50 ? 51 : this.radius;

        fill('#F11B82');
        noStroke();
        var l = 30 + this.radius / 2 + '%';
        var fillColor = 'hsl(60, 80%,' + l + ')';
        fill(color(fillColor));
        ellipse(this.pixelPos[0], this.pixelPos[1], this.radius * 2, this.radius * 2);
    },
    update: function(country) {
        if(this.selected) {
            textSize(13);
            var infotext = 'War Name:' + this.info.WarName;
            var cwidth = textWidth(infotext) > textWidth('Start Date:' + parseDate(this.info.startDate)) ? textWidth(infotext) : textWidth('Start Date:' + parseDate(this.info.startDate));
            infotext +='\n' + 'Casualties:' + this.info.batDeath + '\n' + 'Start Date:' + parseDate(this.info.startDate) + '\n' + 'End Date:' + parseDate(this.info.endDate);
            cwidth += 20;
            textAlign(LEFT);
            fill('rgba(250,50,120,0.4)');
            rect(this.pixelPos[0] - cwidth / 2 , this.pixelPos[1] - 120, cwidth, 80);
            fill('black');
            text(infotext, this.pixelPos[0] - cwidth / 2 + 10, this.pixelPos[1] - 100)
            //rect(this.x, this.y, this.width, this.thickness);
        }
        var mouse = createVector(mouseX, mouseY);
        if(mouse.dist(createVector(this.pixelPos[0], this.pixelPos[1]))< this.radius && !hovered){
            hovered = true;
            selected = this;
            fill(0);
            textSize(13);
            text(country.name, mouseX, mouseY);
        }
    }
}


function drawBubbles(decade, ctx) {
    if (decade && bubbles[decade]) {
        bubbles[decade].forEach(function (group) {
            group.draw(ctx);
        })
    }
}

var BubbleGroup = function (option) {
    this.name = option.name;
    this.center = option.center;
    this.participants = option.participants;
    this.bubbles = [];
    this.radius = 30;
}
BubbleGroup.prototype = {
    init: function () {
        var that = this;
        this.center.x += (Math.random() - 0.5) * 50;
        this.center.y += (Math.random() - 0.5) * 50;
        var count = this.participants.length;
        if (count > 4) {
            this.radius = 70;
        }
        this.participants.forEach(function (e, i) {
            function getBubblePos(i) {
                var delta = Math.PI * 2 / count;
                var pos = {
                    x: that.center.x + Math.cos(delta * i) * that.radius * (1 + Math.random() / 2),
                    y: that.center.y + Math.sin(delta * i) * that.radius * (1 + Math.random() / 2)
                }
                return pos;
            }

            function getBubbleRadius(num) {
                var baseRadius = 0;
                if (num <= 1000) {
                    baseRadius = 30;
                }
                if (num > 1000 && num <= 10000) {
                    baseRadius = 40;
                }
                if (num > 10000 && num <= 40000) {
                    baseRadius = 50;
                }
                if (num > 40000) {
                    baseRadius = 60;
                }
                return baseRadius + ~~(baseRadius * Math.random() / 2)
            }
            var pos = getBubblePos(i);
            var info = {
                WarName: that.name,
                countryName: e.country,
                startDate: e.startDate,
                endDate: e.endDate,
                batDeath: e.batDeath,
                side: e.side,
                outcome: e.outcome
            }
            var randColor = getRandomColor();
            var radius = getBubbleRadius(e.batDeath);
            var option = {
                center: that.center,
                position: pos,
                info: info,
                color: randColor,
                radius: radius
            }

            var bubble = new Bubble(option);
            that.bubbles.push(bubble);
        })
    },

    draw: function (ctx) {
        this.bubbles.forEach(function (e) {
            myCountries.forEach(function(country) {
                if(country.name && country.name == e.info.countryName) {
                    var countryCenter = getPolygenCenter(country.coordinates[0]);
                    e.draw(ctx,countryCenter);
                }

            })
        })
        this.bubbles.forEach(function (e) {
            myCountries.forEach(function(country) {
                if(country.name && country.name == e.info.countryName) {
                    e.update(country);
                }

            })
        })
    }
}

function createBubbles() {
    timelineDots.forEach(function (e) {
        var decade = e.decade;
        bubbles[decade] = [];
        if (e.wars) {
            e.wars.forEach(function (war) {
                var position = {
                    x: 500,
                    y: 250
                };
                var bubbleGroup = new BubbleGroup({
                    name: war.name,
                    center: position,
                    participants: war.participants
                });
                bubbleGroup.init();
                bubbles[decade].push(bubbleGroup);
            })
        }
    })
}

var War = function (obj) {
    this.id = obj.WarNum;
    this.name = obj.WarName;
    this.year = obj.StartYear1;
    this.location = obj.WhereFought;
    this.decade = ~~(obj.StartYear1 / 10);
    this.participants = [];

}
War.prototype = {
    addParticipant: function (obj) {
        var participant = {
            country: obj.StateName,
            startDate: new Date(obj.StartYear1, obj.StartMonth1, obj.StartDay1),
            endDate: new Date(obj.EndYear1, obj.EndMonth1, obj.EndDay1),
            batDeath: obj.BatDeath,
            side: obj.Side,
            outcome: obj.Outcome
        }
        this.participants.push(participant);
    }
}


var getWars = function (row) {
    var obj = row.obj;
    var isWarExists = wars.some(function (e) {
        if (e.id == obj.WarNum) {
            e.addParticipant(obj);
        };
        return e.id == obj.WarNum;
    });
    if (!isWarExists) {
        var war = new War(obj);
        war.addParticipant(obj);
        wars.push(war);
    }
}

var getDots = function () {
    wars.forEach(function (war) {
        var isDecadeExists = timelineDots.some(function (dot) {
            if (dot.decade == war.decade) {
                dot.addWar(war);
            }
            return dot.decade == war.decade;
        });
        if (!isDecadeExists) {
            var dot = new TimelineDot(war.decade);
            dot.addWar(war);
            timelineDots.push(dot);
        }
    })
    var index = 0;
    while (index < timelineDots.length - 1) {
        if (timelineDots[index].decade + 1 != timelineDots[index + 1].decade) {
            timelineDots.splice(index + 1, 0, {
                decade: timelineDots[index].decade + 1
            });
        }
        index += 1;
    }
}
function mouseClicked() {
    if(lastSelected) {
        lastSelected.selected = false;
    }
    if(selected) {
        if(lastSelected) {
            lastSelected.selected = false;
        }
        lastSelected = selected;
        selected.selected = true;
    }
}

function mercator(lat, lon) {
    var scale = 150;
    var x = radians(lon);
    var y = log(tan(PI / 4 + radians(lat) / 2));
    x *= scale;
    y *= scale;
    x += width / 2;
    y = height / 2 - y + 50;
    vertex(x, y);
}
function geo2pixel(ctx, lon, lat) {
    var scale = 150;
    var x = ctx.radians(lon);
    var y = log(ctx.tan(PI / 4 + ctx.radians(lat) / 2));
    x *= scale;
    y *= scale;
    x += width / 2;
    y = height / 2 - y + 50;
    return ([x,y]);
}

function getRandomColor() {
    var r = ~~(Math.random() * 255);
    var g = ~~(Math.random() * 255);
    var b = ~~(Math.random() * 255);
    return 'rgba(' + r + ',' + g + ',' + b + ',0.5)';
}

function timeLineSlideStart() {
    if (timeLine.mousePosDetect()) {
        slide = true;
    }
}

function timeLineSlideEnd() {
    slide = false;
}

function timeLineSlide() {
    if (!slide) {
        return timeLine.slideDot.x;
    }
    return mouseX;
}
function getPolygenCenter(arr) {
    var lon = 0;
    var lat = 0;
    arr.forEach(function(e) {
        lon += e[0];
        lat += e[1];
    });
    var l = arr.length;
    return ([lon / l, lat / l]);
}

function parseDate(d) {
    var y = d.getFullYear();
    var m = d.getMonth() + 1;
    var d = d.getDate();
    return y + '-' + m + '-' + d;
}
