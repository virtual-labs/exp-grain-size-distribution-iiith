'use strict';

document.addEventListener('DOMContentLoaded', function() {

	const restartButton = document.getElementById('restart');
	const instrMsg = document.getElementById('procedure-message');

	restartButton.addEventListener('click', function() { restart(); });

	function rotate(objs, rotation, rotLim)
	{
		if(!rotation)
		{
			return 0;
		}

		objs['sieves'].angle += rotation;
		objs['shaker'].angle += rotation;
		objs['soil'].angle += rotation;
		objs['lid'].angle += rotation;

		if(objs['shaker'].angle === 0 && rotCtr === 10)
		{
			rotation = 0;
			objs['sieves'].sieveArr.forEach(function(sieve, ix) {
				objs['sieves'].sieveArr[ix].pos[0] = objs['sieves'].pos[0];
				objs['sieves'].sieveArr[ix].pos[1] = objs['sieves'].pos[1] + (objs['sieves'].count - ix - 1) * objs['sieves'].height / objs['sieves'].count + 10 * ix;
			});

		}

		if(objs['shaker'].angle === rotation * rotLim / math.abs(rotation))
		{
			rotation *= -1;
			rotCtr += 1;
		}

		return rotation;
	};

	function randomNumber(min, max) {
		return Number((Math.random() * (max - min + 1) + min).toFixed(2));
	};

	function logic(tableData, retainedData)
	{
		const sum = retainedData.reduce((a, b) => {return a + b;}, 0), sizes = [];
		retainedData.forEach(function (category, i) {
			retainedData[i] *= 100 / sum;
			retainedData[i] = (100 - retainedData[i]);
			if(i)
			{
				retainedData[i] += retainedData[i - 1] - 100;
			}

			retainedData[i] = retainedData[i].toFixed(2);
		});

		retainedData[retainedData.length - 1] = 0;
		tableData.forEach(function(row, index) {
			sizes.push(Number(row['Sieve Size(mm)']));
			row['Percent Passing'] = retainedData[index]
			row['Soil Retained(g)'] = (100 - retainedData[index]) * soilMass / 100;
			if(index)
			{
				row['Soil Retained(g)'] = (retainedData[index - 1] - retainedData[index]) * soilMass / 100;
			}

			row['Soil Retained(g)'] = row['Soil Retained(g)'].toFixed(2);
		});

		//console.log(sizes)
		drawGraph(sizes, retainedData, ['Grain Size', '% finer'], 'plot');
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
			const e1 = [this.pos[0] + this.width, this.pos[1]], e2 = [...this.pos];
			const gradX = (e1[0] - e2[0]) / -4, gradY = 5;

			ctx.beginPath();
			ctx.rect(this.pos[0], this.pos[1], this.width, this.height);
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
		constructor(height, width, angle, count, x, y) {
			this.height = height;
			this.width = width;
			this.angle = angle;
			this.count = count;
			this.pos = [x, y];

			this.sieveArr = [];
			for (var i = 0; i < this.count; ++i)
			{
				this.sieveArr.push(new sieve(this.height / this.count, this.width, this.pos[0], this.pos[1] + (this.count - i - 1) * this.height / this.count + 10 * i));
			}
		};

		draw(ctx, rotation) {
			ctx.fillStyle = "white";
			ctx.lineWidth = 3;
			if(rotation)
			{
				ctx.translate(this.pos[0] + this.width / 2, this.pos[1] + this.height / 2);
				ctx.rotate(this.angle * Math.PI / 180);
			}

			this.sieveArr.forEach(function (elem, ix) {
				if(rotation)
				{
					this.sieveArr[ix].pos[0] = -this.width / 2;
					this.sieveArr[ix].pos[1] = -this.height / 2 + (this.count - ix - 1) * this.height / this.count + 10 * ix;
				}

				elem.draw(ctx);
			}, this);
			ctx.setTransform(1, 0, 0, 1, 0, 0);
		};

		move(translate) {
			this.sieveArr.forEach(function(elem, ix) {
				updatePos(elem, translate);
			});
		};

		weigh(idx, translate, lim, step) {
			if(lim[1] > this.sieveArr[idx].pos[1] && translate[1] < 0)
			{
				translate[1] *= -1;
			}

			updatePos(this.sieveArr[idx], translate);
			const temp = limCheck(this.sieveArr[idx], translate, lim, step);

			if(temp != step)
			{
				idx += 1;
				translate[0] = -5;
				if(step === 2)
				{
					translate[1] = -5;
					lim[1] = lim[1] - this.height / this.count + 10;
				}
			}

			return idx;
		};
	};

	class lid {
		constructor(height, width, angle, x, y) {
			this.height = height;
			this.width = width;
			this.angle = angle;
			this.pos = [x, y];
		};

		draw(ctx) {
			ctx.fillStyle = "#A9A9A9";
			ctx.lineWidth = 3;
			const correction = 1;

			ctx.translate(this.pos[0] + this.width / 2, this.pos[1] + this.height / 2);
			ctx.rotate(this.angle * Math.PI / 180);

			ctx.beginPath();
			ctx.rect(-this.width / 2 + this.angle * correction, -this.height / 2, this.width, this.height);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
			ctx.setTransform(1, 0, 0, 1, 0, 0);
		};
	};

	class soil {
		constructor(height, width, angle, x, y) {
			this.height = height;
			this.width = width;
			this.angle = angle;
			this.pos = [x, y];
			this.img = new Image();
			this.img.src = './images/uneven-soil.png';
			this.img.onload = () => {ctx.drawImage(this.img, this.pos[0], this.pos[1], this.width, this.height);};
		};

		draw(ctx) {
			const correction = 35 / math.pow((this.pos[1] - 70), 2);

			ctx.translate(this.pos[0] + this.width / 2, this.pos[1] + this.height / 2);
			ctx.rotate(this.angle * Math.PI / 180);
			ctx.drawImage(this.img, -this.width / 2 + this.angle * correction, -this.height / 2, this.width, this.height);
			ctx.setTransform(1, 0, 0, 1, 0, 0);
		};

		shrink(scale) {
			if(this.height > 25)
			{
				this.height -= scale;
			}
		};
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
			const zigzagSpacing = 10, zigzagHeight = 30;
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

			this.zigzag(ctx, this.pos[0] + rodGap + rodWidth + this.width * (1 - 2 * rodGap) / 4, this.pos[1] + this.height * vibePart * (1 - gap / 2) - 10);
			this.zigzag(ctx, this.pos[0] + rodGap + rodWidth + 3 * this.width * (1 - 2 * rodGap) / 4 + 20, this.pos[1] + this.height * vibePart * (1 - gap / 2) - 10);

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

	function drawGraph(Xaxis, Yaxis, text, id) {
		try {
			// render the plot using plotly
			let col = [];
			//Xaxis.forEach(function(val, ind){
				//col.push("blue");
				//if(ind === point)
				//{
					//col[ind] = "red";
				//}
			//});

			const trace1 = {
				x: Xaxis,
				y: Yaxis,
				type: 'scatter',
				mode: 'lines',
			};

			const layout = {
				width: 450,
				height: 450,
				xaxis: {
					title: {
						text: text[0],
						font: {
							family: 'Courier New, monospace',
							size: 18,
							color: '#000000'
						}
					},
				},
				yaxis: {
					title: {
						text: text[1],
						font: {
							family: 'Courier New, monospace',
							size: 18,
							color: '#000000'
						}
					}
				}
			};

			const config = {responsive: true};
			const data = [trace1];
			Plotly.newPlot(id, data, layout, config);
		}

		catch (err) {
			console.error(err);
			alert(err);
		}
	}

	function init()
	{
		document.getElementById("output1").innerHTML = "Mass of soil = ___ g";

		idx = 0;
		objs = {
			"weight": new weight(270, 240, 90, 180),
			"shaker": new shaker(360, 180, 0, 570, 20),
			"sieves": new sieves(210, 90, 0, 6, 660, 170),
			"lid": new lid(35, 90, 0, 615, 70),
			"soil": new soil(60, 90, 0, 660, 320),
		};
		keys = [];
		soils = [];

		enabled = [["weight"], ["weight", "sieves"], ["weight", "sieves"], ["weight", "sieves", "soil"], ["weight", "sieves", "soil"], ["sieves", "shaker", "soil"], ["sieves", "shaker", "soil"], ["lid", "sieves", "shaker", "soil"], ["lid", "sieves", "shaker", "soil"], ["weight", "sieves"], []];
		wellGraded = [randomNumber(6, 8), randomNumber(14, 17), randomNumber(18, 21), randomNumber(18, 23), randomNumber(18, 23), randomNumber(16, 20)];
		uniformGraded = [randomNumber(1, 4), randomNumber(4, 8), randomNumber(6, 12), randomNumber(10, 16), randomNumber(55, 70), randomNumber(7, 10)];

		step = 0;
		translate = [0, 0];
		lim = [-1, -1];
		rotation = 0;
		rotLim = -1;
		rotCtr = 0;
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

	function generateTableHead(table, data, title) {
		const thead = table.createTHead();
		const titleth = document.createElement("th");
		const titleText = document.createTextNode(title);
		titleth.appendChild(titleText);
		titleth.colSpan = data.length;
		thead.appendChild(titleth);

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
					lim[0] = 165;
					lim[1] = 220;
				}

				else if(step === 4 && val === "soil")
				{
					hover = true;
					translate[0] = -5;
					translate[1] = -5;
					lim[0] = 165;
					lim[1] = 105;
				}

				else if(step === 6 && val === "sieves")
				{
					hover = true;
					translate[0] = 5;
					lim[0] = objs['shaker'].pos[0] + objs['shaker'].width / 2 - objs['sieves'].width / 2;
				}

				else if(step === 8 && val === "shaker" && canvasPos[1] >= objs[val].pos[1] + objs[val].height * 0.85 - errMargin && canvasPos[1] <= objs[val].pos[1] + objs[val].height + errMargin)
				{
					hover = true;
					rotation = 1;
					rotLim = 5;
					translate[1] = 1;
					lim[1] = 245;
				}

				else if(step === 9 && val === "sieves")
				{
					hover = true;
					translate[0] = -5;
					lim[0] = 165;
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
			rotation = 0;
			rotLim = -1;
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
				soilMass = this.value;
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
		"Click on the sieve set to weigh each sieve.",
		"Click on 'Soil Sample' in the apparatus menu, set appropriate input values (Soil Mass) and click 'Add' to add a soil sample to the workspace.",
		"Click on the soil sample to add it to the sieves and weigh it.",
		"Click on 'Shaker' in the apparatus menu to add a shaker to the workspace.", 
		"Click on the sieve set to move it to the shaker.",
		"Click on 'Lid' in the apparatus menu to add a lid to the sieve set in the shaker.",
		"Click on the shaker blue portion at the bottom to start the shaker and properly sieve the soil.",
		"Click on the sieve set containing soil at different levels(sieves) to weigh each sieve separately.",
		"Click the restart button to perform the experiment again.",
	];

	let step, translate, lim, rotation, rotLim, objs, keys, enabled, small, idx, rotCtr, soils, wellGraded, uniformGraded;
	init();

	const wellGradedTableData = [
		{ "Sieve Size(mm)": "300", "Sieve Mass(g)": "10", "Soil Retained(g)": "", "Percent Passing": "" },
		{ "Sieve Size(mm)": "80", "Sieve Mass(g)": "10", "Soil Retained(g)": "", "Percent Passing": "" },
		{ "Sieve Size(mm)": "40", "Sieve Mass(g)": "10", "Soil Retained(g)": "", "Percent Passing": "" },
		{ "Sieve Size(mm)": "20", "Sieve Mass(g)": "10", "Soil Retained(g)": "", "Percent Passing": "" },
		{ "Sieve Size(mm)": "10", "Sieve Mass(g)": "10", "Soil Retained(g)": "", "Percent Passing": "" },
		{ "Sieve Size(mm)": "4.75", "Sieve Mass(g)": "10", "Soil Retained(g)": "", "Percent Passing": "" }
	], uniformGradedTableData = [...wellGradedTableData];

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

			keys.push(elem);
			step += 1;
		});
	});

	// Input Parameters 
	let soilMass = 100; 
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

				objs[name].draw(ctx, rotation);
			}
		});

		if(soils.length)
		{
			soils.forEach(function(lvl, ix) {
				soils[ix].angle += rotation;
				lvl.draw(ctx, rotation);
			});
		}

		if(ctr === enabled[step].length)
		{
			document.getElementById("main").style.pointerEvents = 'auto';
		}

		rotation = rotate(objs, rotation, rotLim);
		if(translate[0] != 0 || translate[1] != 0)
		{
			let temp = step;
			const soilMoves = [4, 6, 8], sieveSetMoves = [6], sievesMoves = [2, 9], soilSetMoves = [9];

			if(soilMoves.includes(step))
			{
				updatePos(objs['soil'], translate);
				if(step != 6)
				{
					if(step === 4)
					{
						objs['soil'].shrink(5);
					}

					temp = limCheck(objs['soil'], translate, lim, step);
					const currSieve = objs['sieves'].pos[1] + idx * objs['sieves'].height / objs['sieves'].count + 10 * (objs['sieves'].count - idx - 1) + objs['sieves'].height / objs['sieves'].count;
					if(step === 8 && objs['soil'].pos[1] + objs['soil'].height >= currSieve)
					{
						idx += 1;
						soils.push(new soil(10, 90, objs['soil'].angle, objs['soil'].pos[0], objs['soil'].pos[1] + objs['soil'].height - 10));
						objs['soil'].height -= 3;

						if(temp != step)
						{
							idx = 0;
							keys = keys.filter(function(val, index) {
								return val != "soil" && val != "lid";
							});
						}
					}
				}
			}

			else if(soilSetMoves.includes(step))
			{
				updatePos(soils[soils.length - 1 - idx], translate);
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
					objs['sieves'].pos[0] = objs['sieves'].sieveArr[idx - 1].pos[0];
					objs['sieves'].pos[1] = objs['sieves'].sieveArr[idx - 1].pos[1] - 50;
					translate[0] = 0;
					translate[1] = 0;
					temp += 1;
					idx = 0;
				}
			}

			step = temp;
			if(step === 5)
			{
				//logic(wellGradedTableData, wellGraded);
				document.getElementById("output1").innerHTML = "Mass of soil = " + String(soilMass) + "g";
			}

			else if(step === enabled.length - 1)
			{
				keys = [];
				soils = [];

				logic(wellGradedTableData, wellGraded);
				generateTableHead(table, Object.keys(wellGradedTableData[0]), "Well Graded Soil");
				generateTable(table, wellGradedTableData);

				logic(uniformGradedTableData, uniformGraded);
				generateTableHead(table, Object.keys(uniformGradedTableData[0]), "Uniform Graded Soil");
				generateTable(table, uniformGradedTableData);

				document.getElementById("apparatus").style.display = 'none';
				document.getElementById("observations").style.width = '40%';
				if(small)
				{
					document.getElementById("observations").style.width = '85%';
				}
			}
		}

		document.getElementById("procedure-message").innerHTML = msgs[step];
		tmHandle = window.setTimeout(draw, 1000 / fps);
	};

	let tmHandle = window.setTimeout(draw, 1000 / fps);
});
