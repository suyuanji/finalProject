var particleSystem = [];
var investorSystem = [];
var attractors = [];
var table;
var aggregated = {};
var connections = [];
var investors = [];
var table2;
var companiesToDisplay = [];
var investorsToDisplay = [];
var investorsParticles = [];
var investorsAggregated = [];
var button;

function preload() {
    table = loadTable("data/investments.csv", "csv", "header");
    table2 = loadTable("data/companies_categories.csv", "csv", "header");
}


function setup() {
    var canvas = createCanvas(windowWidth, windowHeight);
    frameRate(30);

    button = createButton('back');
    button.position(width / 2 - 60, height / 2 + 300);
    button.mousePressed(goBack);
    button.hide();

    colorMode(HSB, 360, 100, 100, 100);
    textAlign(CENTER);
    for (var r = 0; r < table.getRowCount(); r++) {
        var cname = table.getString(r, "company_name");
        var invested = table.getString(r, "amount_usd");
        var investorname = table.getString(r, "investor_name")
        invested = parseInt(invested);
        if (!isNaN(invested)) {
            if (aggregated.hasOwnProperty(cname)) {
                aggregated[cname] = aggregated[cname] + invested;
            } else {
                aggregated[cname] = invested;
            }
            if (investorsAggregated.hasOwnProperty(investorname)) {
                investorsAggregated[investorname] = investorsAggregated[investorname] + invested;
            } else {
                investorsAggregated[investorname] = invested;
            }
        }
    }
    /* converts the object into an array of companies */
    var aAggregated = [];
    Object.keys(aggregated).forEach(function (name_) {
        var company = {};
        company.name = name_;
        company.sum = aggregated[name_]
        aAggregated.push(company);
    });

    /* sorts the array by usd amount */
    aAggregated.sort(function (companyA, companyB) {
        return companyB.sum - companyA.sum;
    });

    aAggregated = aAggregated.slice(0, 100);

    var investors = [];
    Object.keys(investorsAggregated).forEach(function (name) {
        var investor = {};
        investor.name = name;
        investors.push(investor);
    });
    
    //create an investorParticle per each investor, put the investor inside the particle and the particle inside the investors
    investors.forEach(function(iv){
        var particle = new investorParticle(iv.name, 12, iv);
        iv.particle = particle;
        investorsParticles.push(particle);
    });

    for (var r = 0; r < table.getRowCount(); r++) {
        var cname = table.getString(r, "company_name");
        var invested = table.getString(r, "amount_usd");
        var investorname = table.getString(r, "investor_name")
        invested = parseInt(invested);

        var foundCompany = aAggregated.find(function (element) {
            return element.name == cname;
        });

        if (foundCompany) {

            var foundInvestor = investors.find(function (element) {
                return element.name == investorname;
            });

            if (foundInvestor) {

                var connection = {};
                connection.company = foundCompany;
                connection.investor = foundInvestor;
                connection.amount = invested;
                connections.push(connection);

            }

        }

    }

    /* creates 100 particles from the array */
    for (var i = 0; i < aAggregated.length; i++) {
        var p = new Particle(aAggregated[i].name, aAggregated[i].sum);
        particleSystem.push(p);
        companiesToDisplay.push(p)
            //print(p);
    }

    /* COUNT THE NUMBER OF CATEGORIES */
    var ob = {}; //this is the counts
    for (var i = 0; i < table2.getRowCount(); i++) {
        var catName = table2.getString(i, "category_code");
        if (ob.hasOwnProperty(catName)) {
            ob[catName]++;
        } else {
            ob[catName] = 1;
        }
    };


    /* creates a central atractor of strength 1 */
    var at = new Attractor(createVector(width / 2, height / 2), 1);
    attractors.push(at);
}


function draw() {
    background(0,0,0);

    /*checks for pairs of particles*/
    for (var STEPS = 0; STEPS < 4; STEPS++) {
        for (var i = 0; i < particleSystem.length - 1; i++) {
            for (var j = i + 1; j < particleSystem.length; j++) {
                var pa = particleSystem[i];
                var pb = particleSystem[j];
                var ab = p5.Vector.sub(pb.pos, pa.pos);
                var distSq = ab.magSq();
                if (distSq <= sq(pa.radius + pb.radius)) {
                    var dist = sqrt(distSq);
                    var overlap = (pa.radius + pb.radius) - dist;
                    ab.div(dist); //ab.normalize();
                    ab.mult(overlap * 0.5);
                    pb.pos.add(ab);
                    ab.mult(-1);
                    pa.pos.add(ab);

                    pa.vel.mult(0.97);
                    pb.vel.mult(0.97);

                }
            }
        }
    }


    for (var i = companiesToDisplay.length - 1; i >= 0; i--) {
        var p = companiesToDisplay[i];
        p.update();
        p.draw();
    }
    
    investorsToDisplay.forEach(function(investorParticle){
        investorParticle.update();
        investorParticle.draw();
    });



}

/*COMPANY PARTICLES HERE*/
var Particle = function (name, sum, category) {
    this.name = name;
    this.sum = sum;
    this.category = category

    this.radius = sqrt(sum) / 4000;
    var initialRadius = this.radius;

    var isMouseOver = false;
    var maximumRadius = 70;

    var tempAng = random(TWO_PI);
    this.pos = createVector(cos(tempAng), sin(tempAng));
    this.pos.div(this.radius);
    this.pos.mult(1000);
    this.pos.set(this.pos.x + width / 2, this.pos.y + height / 2);
    this.vel = createVector(0, 0);
    var acc = createVector(0, 0);

    var rowCat = table2.findRow(this.name, "name");

    if (rowCat != null) {
        this.categoryName = rowCat.get("category_code");
    } else {
        //print(this.name);
    }
    //print (rowCat);

    switch(this.categoryName){
            case"software" :
                this.color = {h: 20, s: 50, b: 125};
                break;
            case"web" :
                this.color = {h: 30, s: 80, b: 160};
                break;
            case"biotech" :
                this.color = {h: 20, s: 70, b: 140};
                break;
            case"mobile" :
                this.color = {h: 40, s: 70, b: 250};
                break;
            case"enterprise" :
                this.color = {h: 20, s: 40, b: 150};
                break;
            case"ecommerce" :
                this.color = {h: 59, s: 99, b: 96};
                break;
            default:
                this.color = {h: 10, s: 20, b: 180};
        
    }

    this.update = function () {
        checkMouse(this);

        attractors.forEach(function (A) {
            var att = p5.Vector.sub(A.pos, this.pos);
            var distanceSq = att.magSq();
            if (distanceSq > 1) {
                att.normalize();
                att.div(10);
                //att.mult(this.radius*this.radius/200);
                acc.add(att);
            }
        }, this);
        this.vel.add(acc);
        this.pos.add(this.vel);
        acc.mult(0);
    }

    this.draw = function () {
        noStroke();
        if (isMouseOver) {
            fill(0, 100, 50);
        } else {
            fill(0, 0, 50);
        }

        fill(this.color.h, this.color.s, this.color.b);
        ellipse(this.pos.x,
            this.pos.y,
            this.radius * 2,
            this.radius * 2);

        if (this.radius == maximumRadius) {

            fill(0, 0, 50);
            textSize(8);
            text(this.categoryName, this.pos.x, this.pos.y + 35);

            fill(0, 0, 20);
            textSize(12);
            textStyle(BOLD);
            text(this.name, this.pos.x, this.pos.y - 5);
            textSize(10);
            text(this.sum, this.pos.x, this.pos.y + 10);

        }
    }

    function checkMouse(instance) {
        var mousePos = createVector(mouseX, mouseY)
        if (mousePos.dist(instance.pos) <= instance.radius) {
            incRadius(instance);
            isMouseOver = true;
        } else {
            decRadius(instance);
            isMouseOver = false;
        }

    }

    function incRadius(instance) {
        instance.radius += 4;
        if (instance.radius > maximumRadius) {
            instance.radius = maximumRadius;
        }

    }

    function decRadius(instance) {
        instance.radius -= 4;
        if (instance.radius < initialRadius) {
            instance.radius = initialRadius;
        }
    }

    this.getMouseOver = function () {
        return isMouseOver;
    }
}

/*INVESTOR PARTICLES HERE*/
var investorParticle = function (name, sum, investor) {
    this.invename = name;
    this.totalinvested = sum;
    this.radius = 50;
    this.investor = investor;
    
    var tempAng = random(TWO_PI);
    this.pos = createVector(cos(tempAng), sin(tempAng));
    this.pos.div(this.radius);
    this.pos.mult(8888);
    this.pos.set(this.pos.x + width / 2, this.pos.y + height / 2);
    this.vel = createVector(0, 0);
    var acc = createVector(0, 0);
   
    var isMouseOver = false;

    this.update = function () {
        this.radius = sqrt(this.amount) /4000;
        if(this.angle >= 0 && this.dis > 200) {
            this.dis -= 0.5;
            this.pos.x = width / 2 + cos(this.angle) * this.dis;
            this.pos.y = height / 2 + sin(this.angle) * this.dis;
        }
    }
 this.draw = function () {
            fill(0, 0, 255);
            noStroke();
           
            fill(0, 0, 50);
            ellipse(this.pos.x, this.pos.y, this.radius*6, this.radius*6);
            fill(0,0,200);
            text(this.invename, this.pos.x, this.pos.y);
        }

}


function mouseClicked() {
    var clickedCompany = null;
    companiesToDisplay.forEach(function (co) {

        if (co.getMouseOver()) clickedCompany = co;
    });


    if (clickedCompany != null) {
        companiesToDisplay = [];
        companiesToDisplay.push(clickedCompany)
        console.log(clickedCompany);
        button.show();
    }
    /*else {
           companiesToDisplay = [];
           particleSystem.forEach(function (p) {
               companiesToDisplay.push(p);
           })
       };*/

    investorsToDisplay = [];
    connections.forEach(function (c) {
        if (clickedCompany != null) {
            if (c.company.name == clickedCompany.name) {
                if(!investorsToDisplay.includes(c.investor.particle)){
                    investorsToDisplay.push(c.investor.particle);
                    c.investor.particle.amount = c.amount;
                }else{
                    c.investor.particle.amount += c.amount;
                }
                
            }
        }

    })

    var ang = 0;
    
    investorsToDisplay.forEach(function(p){
        p.angle = ang;
        p.dis = 300;
        p.pos.x = width/2 + cos(ang) * 300;
        p.pos.y = height/2 +sin(ang) *300;
        ang += TWO_PI/investorsToDisplay.length;
    });

};


function goBack() {
    investorsToDisplay = [];
    companiesToDisplay = [];
    particleSystem.forEach(function (p) {
        companiesToDisplay.push(p);
    });
    button.hide();
}

var Attractor = function (pos_, s) {
    this.pos = pos_.copy();
    var strength = s;
    this.draw = function () {
        noStroke();
        fill(0, 100, 100);
        ellipse(this.pos.x, this.pos.y,
            strength, strength);
    }
}




function windowResized() {
    resizeCanvas(windowWidth, windowHeight);

}

$(function() {
    $('.enter').click(function() {
        $('.cover').fadeOut();
    })
})