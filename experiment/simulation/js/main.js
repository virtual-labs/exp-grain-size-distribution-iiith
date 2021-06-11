'use strict';

document.addEventListener('DOMContentLoaded', function() {

	const restartButton = document.getElementById('restart');
	const instrMsg = document.getElementById('procedure-message');

	restartButton.addEventListener('click', function() { restart(); });

	function randomNumber(min, max) {
		return (Math.random() * (max - min + 1) + min).toFixed(2);
	};

	function logic(tableData)
	{
		const soilData = { 'Silt': randomNumber(22.5, 27.5), 'Sand': randomNumber(12, 16), 'Clay': randomNumber(30, 50) };
		tableData.forEach(function(row, index) {
			const ans = (Number)(soilData[row['Soil Type']]);
			row['Water Content(%)'] = ans;
			row['Dry Soil Mass(g)'] = ((100 * wetSoilMass) / (ans + 100)).toFixed(2);
		});
	};

	function limCheck(obj, translate, lim, step)
	{
		if(obj.pos[0] === lim[0])
		{
			translate[0] = 0;
		}

		if(obj.pos[1] === lim[1])
		{
			translate[1] = 0;
		}

		if(translate[0] === 0 && translate[1] === 0)
		{
			if(step === 2)
			{
				document.getElementById("output1").innerHTML = "Mass of sieves = " + String(10) + "g";
			}

			else if(step === 4)
			{
				document.getElementById("output2").innerHTML = "Mass of wet soil = " + String(wetSoilMass) + "g";
			}

			else if(step === enabled.length - 2)
			{
				logic(tableData);
				generateTableHead(table, Object.keys(tableData[0]));
				generateTable(table, tableData);

				document.getElementById("apparatus").style.display = 'none';
				document.getElementById("observations").style.width = '40%';
				if(small)
				{
					document.getElementById("observations").style.width = '85%';
				}
			}

			return step + 1;
		}

		return step;
	};

	function updatePos(obj, translate)
	{
		obj.pos[0] += translate[0];
		obj.pos[1] += translate[1];
	};

	class sieve {
		constructor(height, width, x, y) {
			this.height = height;
			this.width = width;
			this.pos = [x, y];
		};

		draw(ctx) {
			ctx.fillStyle = "white";
			ctx.lineWidth = 3;

			if(this.width < 2 * this.radius) 
			{
				this.radius = this.width / 2;
			}

			if(this.height < 2 * this.radius) 
			{
				this.radius = this.height / 2;
			}

			const e1 = [this.pos[0] + this.width, this.pos[1]], e2 = [...this.pos];
			const gradX = (e1[0] - e2[0]) / -4, gradY = 5;

			ctx.beginPath();
			ctx.moveTo(this.pos[0], this.pos[1]);
			ctx.lineTo(this.pos[0] + this.width, this.pos[1]);
			ctx.lineTo(this.pos[0] + this.width, this.pos[1] + this.height);
			curvedArea(ctx, [this.pos[0] + this.width, this.pos[1] + this.height], gradX, gradY);
			ctx.lineTo(this.pos[0], this.pos[1]);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(e2[0], e2[1]);
			curvedArea(ctx, e2, -1 * gradX, -1 * gradY);
			curvedArea(ctx, e1, gradX, gradY);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
		};
	};

	class sieves {
		constructor(height, width, count, x, y) {
			this.height = height;
			this.width = width;
			this.count = count;
			this.pos = [x, y];

			this.sieveArr = [];
			for (var i = 0; i < this.count; ++i)
			{
				this.sieveArr.push(new sieve(this.height / this.count, this.width, this.pos[0], this.pos[1] + (this.count - i - 1) * this.height / this.count));
			}
		};

		draw(ctx) {
			this.sieveArr.forEach(function(elem, ix) {
				elem.draw(ctx);
			});
		};

		move(translate) {
			this.sieveArr.forEach(function(elem, ix) {
				updatePos(elem, translate);
			});
		};

		weigh(idx, translate, lim, step) {
			updatePos(this.sieveArr[idx], translate);
			const temp = limCheck(this.sieveArr[idx], translate, lim, step);

			if(temp != step)
			{
				if(lim[0] === this.pos[0])
				{
					idx += 1;
					translate[0] = -5;
					translate[1] = -5;
					lim[0] = 155;
					lim[1] = 225;
				}

				else
				{
					translate[0] = 5;
					translate[1] = 5;
					lim[0] = this.pos[0];
					lim[1] = this.pos[1] + (this.count - idx - 1) * this.height / this.count;
					const delay = 1, waitTill = new Date(new Date().getTime() + delay * 1000);
					while(waitTill > new Date()){};
				}
			}

			return idx;
		};
	};

	class soil {
			constructor(height, width, x, y) {
			this.height = height;
			this.width = width;
			this.pos = [x, y];
			this.img = new Image();
			this.img.src = './images/uneven-soil.png';
			this.img.onload = () => {ctx.drawImage(this.img, this.pos[0], this.pos[1], this.width, this.height);};
		};

		draw(ctx) {
			ctx.drawImage(objs['soil'].img, objs['soil'].pos[0], objs['soil'].pos[1], objs['soil'].width, objs['soil'].height);
		}
	};

	class weight{
		constructor(height, width, x, y) {
			this.height = height;
			this.width = width;
			this.pos = [x, y];
			this.img = new Image();
			this.img.src = './images/weighing-machine.png';
			this.img.onload = () => { ctx.drawImage(this.img, this.pos[0], this.pos[1], this.width, this.height); }; 
		};

		draw(ctx) {
			ctx.drawImage(objs['weight'].img, objs['weight'].pos[0], objs['weight'].pos[1], objs['weight'].width, objs['weight'].height);
		};
	};

	class shaker {
		constructor(height, width, angle, x, y) {
			this.height = height;
			this.width = width;
			this.angle = angle;
			this.pos = [x, y];
		};

		zigzag(ctx, startX, startY) {
			const zigzagSpacing = 10, zigzagHeight = 20;
			ctx.lineWidth = 5;
			ctx.strokeStyle = "black";
			ctx.beginPath();
			ctx.moveTo(startX, startY);

			for (var n = 0; n < 5; n++) {
				const y = startY + ((n + 1) * zigzagSpacing);
				var x = startX;

				if (n % 2 == 0) { // if n is even...
					x += zigzagHeight;
				}
				ctx.lineTo(x, y);
			}

			ctx.stroke();
		}

		draw(ctx) {
			// Outline
			const rodWidth = 0.05, rodGap = 0.1, segmentHeight = 0.1, gap = 0.1, vibePart = 0.8;
			ctx.translate(this.pos[0] + this.width / 2, this.pos[1] + this.height * vibePart / 2);
			ctx.rotate(this.angle * Math.PI / 180);

			ctx.lineWidth = 3;

			// Vertical rods
			ctx.fillStyle = "#A9A9A9";
			ctx.beginPath();
			ctx.rect(-this.width * (1 - rodGap) / 2, -this.height * vibePart / 2, this.width * rodWidth, this.height * vibePart);
			ctx.rect(this.width * (1 - rodGap) / 2, -this.height * vibePart / 2, -this.width * rodWidth, this.height * vibePart);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();

			// Horizontal rods
			ctx.fillStyle = "#72A0C1";
			ctx.beginPath();
			ctx.rect(-this.width / 2, -this.height * (1 - gap) * vibePart / 2, this.width, segmentHeight * this.height);
			ctx.rect(-this.width / 2, this.height * (1 - gap) * vibePart / 2, this.width, -segmentHeight * this.height);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();

			ctx.setTransform(1, 0, 0, 1, 0, 0);

			this.zigzag(ctx, this.pos[0] + rodGap + rodWidth + this.width * (1 - 2 * rodGap) / 4, this.pos[1] + this.height * vibePart * (1 - gap / 2));
			this.zigzag(ctx, this.pos[0] + rodGap + rodWidth + 3 * this.width * (1 - 2 * rodGap) / 4 + 20, this.pos[1] + this.height * vibePart * (1 - gap / 2));

			const divide = 0.85;
			ctx.fillStyle = "#72A0C1";
			ctx.lineWidth = lineWidth;
			ctx.beginPath();
			ctx.rect(this.pos[0], this.pos[1] + divide * this.height, this.width, (1 - divide) * this.height);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();

			// Horizontal rectangle at bottom
			const margin = [0.30, 0.05];
			ctx.fillStyle = "white";
			ctx.lineWidth = lineWidth;
			ctx.beginPath();
			ctx.rect(this.pos[0] + margin[0] * this.width, this.pos[1] + (margin[1] + divide) * this.height, (1 - 2 * margin[0]) * this.width, (1 - divide - 2 * margin[1]) * this.height);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();

			ctx.font = "20px Arial";
			ctx.fillStyle = "black";
			ctx.fillText("Shaker", this.pos[0] + margin[0] * this.width + 5, this.pos[1] + (margin[1] + divide) * this.height + 15);

			// Small button at bottom
			const buttonGapX = 0.10;
			ctx.fillStyle = "white";
			ctx.lineWidth = lineWidth;
			ctx.beginPath();
			ctx.rect(this.pos[0] + buttonGapX * this.width, this.pos[1] + (margin[1] + divide) * this.height, (margin[0] - 2 * buttonGapX) * this.width, (1 - divide - 2 * margin[1]) * this.height);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
		};
	};

	function init()
	{
		document.getElementById("output1").innerHTML = "Mass of sieves = ___ g";
		document.getElementById("output2").innerHTML = "Mass of wet soil = ___ g";

		idx = 0;
		objs = {
			"weight": new weight(270, 240, 90, 180),
			"shaker": new shaker(360, 180, 0, 90, 20),
			"sieves": new sieves(150, 90, 6, 555, 230),
			"soil": new soil(60, 90, 660, 320),
		};
		keys = [];

		enabled = [["weight"], ["weight", "sieves"], ["weight", "sieves"], ["sieves", "shaker"], ["sieves", "shaker"], ["sieves", "shaker", "soil"], ["sieves", "shaker", "soil"], ["weight", "sieves", "shaker", "soil"], ["weight", "sieves", "shaker", "soil"], []];
		step = 0;
		translate = [0, 0];
		lim = [-1, -1];
	};

	function restart() 
	{ 
		window.clearTimeout(tmHandle); 

		document.getElementById("inputForm").style.display = 'none';
		document.getElementById("apparatus").style.display = 'block';
		document.getElementById("observations").style.width = '';

		table.innerHTML = "";
		init();

		tmHandle = window.setTimeout(draw, 1000 / fps); 
	};

	function generateTableHead(table, data) {
		const thead = table.createTHead();
		const row = thead.insertRow();
		data.forEach(function(key, ind) {
			const th = document.createElement("th");
			const text = document.createTextNode(key);
			th.appendChild(text);
			row.appendChild(th);
		});
	};

	function generateTable(table, data) {
		data.forEach(function(rowVals, ind) {
			const row = table.insertRow();
			Object.keys(rowVals).forEach(function(key, i) {
				const cell = row.insertCell();
				const text = document.createTextNode(rowVals[key]);
				cell.appendChild(text);
			});
		});
	};

	function check(event, translate, step, flag=true)
	{ 
		if(translate[0] != 0 || translate[1] != 0)
		{
			return;
		}

		const canvasPos = [(canvas.width / canvas.offsetWidth) * (event.pageX - canvas.offsetLeft), (canvas.height / canvas.offsetHeight) * (event.pageY - canvas.offsetTop)];
		const errMargin = 10;

		let hover = false;
		canvas.style.cursor = "default";
		keys.forEach(function(val, ind) {
			if(canvasPos[0] >= objs[val].pos[0] - errMargin && canvasPos[0] <= objs[val].pos[0] + objs[val].width + errMargin && canvasPos[1] >= objs[val].pos[1] - errMargin && canvasPos[1] <= objs[val].pos[1] + objs[val].height + errMargin)
			{
				if(step === 2 && val === "sieves")
				{
					hover = true;
					translate[0] = -5;
					translate[1] = -5;
					lim[0] = 155;
					lim[1] = 225;
				}

				else if(step === 4 && val === "sieves")
				{
					hover = true;
					translate[0] = -5;
					translate[1] = -5;
					lim[0] = 135;
					lim[1] = 95;
				}

				else if(step === 6 && val === "soil")
				{
					hover = true;
					translate[0] = -5;
					translate[1] = -5;
					lim[0] = 100;
					lim[1] = 75;
				}

				else if(step === 7 && val === "shaker" && canvasPos[0] >= objs[val].pos[0] - errMargin && canvasPos[0] <= objs[val].pos[0] + objs[val].width + errMargin && canvasPos[1] >= objs[val].pos[1] + objs[val].height * 0.8 - errMargin && canvasPos[1] <= objs[val].pos[1] + objs[val].height + errMargin)
				{
					hover = true;
					translate[1] = 1;
					lim[1] = 210;
				}

				else if(step === 8 && val === "sieves")
				{
					hover = true;
					translate[0] = -5;
					translate[1] = -5;
					lim[0] = 135;
					lim[1] = 110;
				}
			}
		});

		if(!flag && hover)
		{
			canvas.style.cursor = "pointer";
			translate[0] = 0;
			translate[1] = 0;
			lim[0] = 0;
			lim[1] = 0;
		}
	};

	const sliders = ["soilMass"];
	sliders.forEach(function(elem, ind) {
		const slider = document.getElementById(elem);
		const output = document.getElementById("demo_" + elem);
		output.innerHTML = slider.value; // Display the default slider value

		slider.oninput = function() {
			output.innerHTML = this.value;
			if(ind === 0)
			{
				wetSoilMass = this.value;
			}
		};
	});

	function curvedArea(ctx, e, gradX, gradY)
	{
		ctx.bezierCurveTo(e[0], e[1] += gradY, e[0] += gradX, e[1] += gradY, e[0] += gradX, e[1]);
		ctx.bezierCurveTo(e[0] += gradX, e[1], e[0] += gradX, e[1] -= gradY, e[0], e[1] -= gradY);
	};

	const canvas = document.getElementById("main");
	canvas.width = 840;
	canvas.height = 400;
	canvas.style = "border:3px solid";
	const ctx = canvas.getContext("2d");

	const fill = "#A9A9A9", border = "black", lineWidth = 1.5, fps = 150;
	const msgs = [
		"Click on 'Weighing Machine' in the apparatus menu to add a weighing machine to the workspace.", 
		"Click on 'Sieves' in the apparatus menu to add a set of sieves to the workspace.",
		"Click on the sieve set to weigh each sieve separately.",
		"Click on 'Shaker' in the apparatus menu to add a shaker to the workspace.", 
		"Click on the sieve set to move it to the shaker.",
		"Click on 'Soil Sample' in the apparatus menu, set appropriate input values (Soil Mass) and click 'Add' to add a soil sample to the workspace.",
		"Click on the soil sample to add it to the sieves and weigh it.",
		"Click on the shaker red portion to start the shaker and heat the soil.",
		"Click on the sieves with dry soil to weigh it.",
		"Click the restart button to perform the experiment again.",
	];

	let step, translate, lim, objs, keys, enabled, small, idx;
	init();

	const tableData = [
		{ "Soil Type": "Silt", "Dry Soil Mass(g)": "", "Water Content(%)": "" },
		{ "Soil Type": "Sand", "Dry Soil Mass(g)": "", "Water Content(%)": "" },
		{ "Soil Type": "Clay", "Dry Soil Mass(g)": "", "Water Content(%)": "" },
	];

	const objNames = Object.keys(objs);
	objNames.forEach(function(elem, ind) {
		const obj = document.getElementById(elem);
		obj.addEventListener('click', function(event) {
			if(elem === "soil")
			{
				enabled[step].pop();
				document.getElementById("inputForm").style.display = 'block';
				return;
			}

			else if(elem === "shaker")
			{
				keys = keys.filter(function(val, index) {
					return val != "weight";
				});
			}

			keys.push(elem);
			step += 1;
		});
	});

	// Input Parameters 
	let wetSoilMass = 100; 
	canvas.addEventListener('mousemove', function(event) {check(event, translate, step, false);});
	canvas.addEventListener('click', function(event) {check(event, translate, step);});

	const submitButton = document.getElementById("submit"), table = document.getElementsByClassName("table")[0];
	submitButton.addEventListener('click', function(event) {
		document.getElementById("inputForm").style.display = 'none';
		enabled[step].push("soil");
		keys.push("soil");
		step += 1;
	});

	function responsiveTable(x) {
		if(x.matches)	// If media query matches
		{ 
			small = true;
			if(step === enabled.length - 1)
			{
				document.getElementById("observations").style.width = '85%';
			}
		} 

		else
		{
			small = false;
			if(step === enabled.length - 1)
			{
				document.getElementById("observations").style.width = '40%';
			}
		}
	};

	let x = window.matchMedia("(max-width: 1023px)");
	responsiveTable(x); // Call listener function at run time
	x.addListener(responsiveTable); // Attach listener function on state changes

	function draw()
	{
		ctx.clearRect(0, 0, canvas.width, canvas.height); 
		ctx.lineCap = "round";
		ctx.lineJoin = "round";

		let ctr = 0;
		document.getElementById("main").style.pointerEvents = 'none';

		objNames.forEach(function(name, ind) {
			document.getElementById(name).style.pointerEvents = 'auto';
			if(keys.includes(name) || !(enabled[step].includes(name)))
			{
				document.getElementById(name).style.pointerEvents = 'none';
			}

			if(keys.includes(name)) 
			{
				if(enabled[step].includes(name))
				{
					ctr += 1;
				}

				objs[name].draw(ctx);
			}
		});

		if(ctr === enabled[step].length)
		{
			document.getElementById("main").style.pointerEvents = 'auto';
		}

		if(translate[0] != 0 || translate[1] != 0)
		{
			let temp = step;
			const soilMoves = [6], sieveSetMoves = [4], sievesMoves = [2];

			if(soilMoves.includes(step))
			{
				updatePos(objs['soil'], translate);
				if(step === 7)
				{
					objs['soil'].heating(translate[1]);
				}

				if(step === 4 || step === 7)
				{
					temp = limCheck(objs['soil'], translate, lim, step);
				}
			}

			if(sieveSetMoves.includes(step))
			{
				updatePos(objs['sieves'], translate);
				objs['sieves'].move(translate);
				temp = limCheck(objs['sieves'], translate, lim, step);
			}

			else if(sievesMoves.includes(step))
			{
				idx = objs['sieves'].weigh(idx, translate, lim, step);
				if(idx >= objs['sieves'].count)
				{
					translate[0] = 0;
					translate[1] = 0;
					temp += 1;
				}
			}

			step = temp;
		}

		document.getElementById("procedure-message").innerHTML = msgs[step];
		tmHandle = window.setTimeout(draw, 1000 / fps);
	};

	let tmHandle = window.setTimeout(draw, 1000 / fps);
});
