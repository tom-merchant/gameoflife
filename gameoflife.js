
var WIDTH, HEIGHT;

var cells = [];
var initial_state = [];
var generations = 0;
var gridWidth = 101, gridHeight = 101, gridSize = gridWidth * gridHeight;
var ctx;
var t_last = 0;
var mx = 0, my = 0;
var mdown = false;
var isRunning = false, canDraw = false;
var canvas;
var speedinput;
var cWidth = 0, cHeight = 0;
var placebp;
var blueprint;

var fps = 0;

var simspeed = 10;

var m1down = false;
var m2down = false;

var showgrid;

function init()
{
	canvas = document.getElementById("cnv");
	ctx = canvas.getContext("2d");

	showgrid = document.getElementById("showgrid");

	speedinput = document.getElementById("speed");
	speedinput.addEventListener("input", onUpdateSpeed, false);

	placebp = document.getElementById("placebp");
	blueprint = document.getElementById("bp");

	WIDTH = canvas.width;
	HEIGHT = canvas.height;

	window.addEventListener("mousemove", onMouseMove, false);
	window.addEventListener("mousedown", onMouseDown, false);
	window.addEventListener("mouseup", onMouseUp, false);

	for(var i = 0; i < gridSize; i++)
	{
		var y = Math.floor(i / gridWidth);
		var x = i - (y*gridWidth);

		if(typeof(cells[x]) === "undefined")
		{
			cells.push(new Array(gridHeight));
		}

		cells[x][y] = false;
	}

	canDraw = true;


	//define the cell width and height (they will remain constant from this point)
	cWidth = (WIDTH - 1) / gridWidth;
	cHeight = (HEIGHT - 1) / gridHeight;


	//Enter main loop
	window.requestAnimationFrame(mainLoop);
}

function mainLoop(timeStamp)
{
	//basic animation loop
	var delta = (timeStamp - t_last) / 1000;
	t_last = timeStamp;
	fps = 1 / delta;
	update(delta);
	draw();
	window.requestAnimationFrame(mainLoop);
}

function draw()
{
	//Clear canvas
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0, 0, WIDTH, HEIGHT);

	//Set styling
	ctx.strokeStyle="#000000";
	ctx.fillStyle = "#000000";
	ctx.lineWidth = 1;

	//Draws gridWidth * gridHeight grid of cWdith * cHeight cells with 1px borders
	if(showgrid.checked)
	{
		drawGrid();
	}

	//Loops through each cell and if it's alive it gets filled in
	for(var i = 0; i < gridSize; i++)
	{
		var y = Math.floor(i / gridWidth);
		var x = i - (y*gridWidth);

		if(cells[x][y])
		{
			ctx.fillRect(x * cWidth + 1, y * cHeight + 1, cWidth, cHeight);
		}
	}

	if(canDraw && !placebp.checked)
	{
		//Snaps mouse position to nearest cell
		ctx.fillRect(mx - (mx % cWidth) + 1, my - (my % cHeight) + 1, 10, 10);
	}
	else if (canDraw && placebp.checked)
	{
		var x = mx - (mx % cWidth) + 1;
		var y = my - (my % cHeight) + 1;

		var bpdata = blueprint.value.split(",");
		var w = bpdata[0];
		var h = bpdata[1];
		var px = bpdata[2].split("");

		ctx.fillStyle = "#AAAAAA99";
		for(var c = 0; c < w; c++)
		{
			for(var r = 0; r < h; r++)
			{
				var live = parseInt(px[r * w + c]) == 1;

				if(live)
				{
					ctx.fillRect(wrap(x + c * cWidth, 0, gridWidth * cWidth), wrap(y + r * cHeight, 0, gridHeight * cHeight), cWidth - 1, cHeight - 1);
				}
			}
		}
		ctx.fillStyle = "#000";

	}
}

function drawGrid()
{
	ctx.beginPath();
	//Loop through each grid x coordinate, translate it to screen y and draw a line from y = 0 -> HEIGHT
	for(var i = 0; i < gridWidth + 1; i++)
	{
		var x = i * (WIDTH / gridWidth);
		ctx.moveTo(x, 0);
		ctx.lineTo(x, HEIGHT);
	}

	//Same but with y coords and lines from x = 0 -> WIDTH
	for(var i = 0; i < gridHeight + 1; i++)
	{
		var y = i * (HEIGHT / gridHeight);

		ctx.moveTo(0, y);
		ctx.lineTo(WIDTH, y);
	}
	//Calling ctx.stroke() as little as possible reduces the amount of draw calls = better framerate
	ctx.stroke();
	ctx.closePath();
}

//Would be nice if ES2017 came out and I didn't have to keep defining this
function clamp(num, min, max)
{
  return num <= min ? min : num >= max ? max : num;
}

//Cells will need recursively copying since it is a 2d array
function recursiveCopy(array)
{
	var ret = [];

	for (var i = 0; i < array.length; i++)
	{
		var obj = {};
		var item = array[i];

		for (var k in item)
		{
			obj[k] = item[k];
		}

		ret.push(obj);
	}

	return ret;
}

var n = 0;

function update(dt)
{
	var skipFrames = Math.floor(fps / simspeed);
	n++;
	if(isRunning && n % skipFrames == 0)
	{
		generations++;
		/*We make a copy of the grid which we will use
		as the grid later, this is because we don't want
		to modify the grid of cells during iteration
		we need pseudo parallel computation, the cells move together through time*/
		var gridCopy = recursiveCopy(cells);

		for(var x = 0; x < gridWidth; x++)
		{
			/*Doing X then Y jumps around memory less
			It's friendlier on the CPU, but it probably only saves nanoseconds of time*/
			for(var y = 0; y < gridHeight; y++)
			{
				var nNeighbours = countNeighbours(x, y);

				//Actual conway logic here :)
				if(cells[x][y])
				{
					if(nNeighbours < 2 || nNeighbours > 3)
					{
						gridCopy[x][y] = false;
					}
				}
				else if(nNeighbours == 3)
				{
					gridCopy[x][y] = true;
				}
			}
		}

		cells = gridCopy;
	}
	else if (canDraw && m1down && placebp.checked)
	{
		var cx = wrap((mx - (mx % cWidth)), 0, WIDTH) / cWidth;
		var cy = wrap((my - (my % cHeight)), 0, HEIGHT) / cHeight;

		var bpdata = blueprint.value.split(",");
		var w = bpdata[0];
		var h = bpdata[1];
		var px = bpdata[2].split("");

		for(var c = 0; c < w; c++)
		{
			for(var r = 0; r < h; r++)
			{
				var live = parseInt(px[r * w + c]) == 1;

				if(live)
				{
					cells[wrap(cx + c, 0, gridWidth)][wrap(cy + r, 0, gridHeight)] = live;
				}
			}
		}

	}
	else if(canDraw && (m1down || m2down) && mx > 0 && mx < WIDTH && my > 0 && my < HEIGHT)
	{
		var cx = clamp((mx - (mx % cWidth)) / cWidth, 0, gridWidth - 1);
		var cy = clamp((my - (my % cHeight)) / cHeight, 0, gridHeight - 1);

		cells[cx][cy] = (m1down ? true : false);
	}
}

function wrap(num, start, end)
{
	if((num - start) < 0)
	{
		return end - Math.abs(num);
	}

	return (num - start) % end;
}

var checkKernel = [[-1, -1], [0, -1], [1, -1],
									 [-1, 0],  /*cell*/ [1, 0],
								 	 [-1, 1],  [0, 1],  [1, 1]];

function countNeighbours(x, y)
{
	var total = 0;

	//To handle edge cases we will wrap around back to the other side of the grid
	//This makes our "living space" a torus, this is fine
	for (var i = 0; i < checkKernel.length; i++)
	{
		//true == 1 in numeric operations, false == 0
		total += cells[wrap(x + checkKernel[i][0], 0, gridWidth)][wrap(y + checkKernel[i][1], 0, gridHeight)];
	}

	return total;
}

function begin()
{
	isRunning = true;
	canDraw = false;
	initial_state = recursiveCopy(cells);
}

function resetGame()
{
	isRunning = false;
	canDraw = true;
	generations = 0;
	cells = recursiveCopy(initial_state);
}

function clearGrid()
{
	isRunning = false;
	canDraw = true;

	for(var x = 0; x < gridWidth; x++)
	{
		for(var y = 0; y < gridHeight; y++)
		{
			cells[x][y] = false;
		}
	}
}

//Broken, maybe should save to images instead, who knows
/*function saveState()
{
	var state = gridWidth + "," + gridHeight;
	for(var x = 0; x < gridWidth; x++)
	{
		for(var y = 0; y < gridHeight; y++)
		{
			state += (cells[x][y] ? ",1" : ",0");
		}
	}

	document.getElementById("outbox").value = state;
}

function loadState()
{
	var st = document.getElementById("inbox").value;
	var re = new RegExp("([0-9]+),([0-9]+)(,[0-1])+");
	var str = st.trim().match(re);

	if(str && str.length > 2 && parseInt(str[0] == gridWidth) && parseInt(str[2] == gridHeight))
	{
		var len = data[0] * data[1];
		var newcells = [];

		if(str.length  == len + 2)
		{
			for (var i = 2; i < len + 2; i++)
			{
				var y = Math.floor((i - 2) / str[0]);
				var x = i - (y*str[0]);

				newcells[x] = newcells[x] || new Array(parseInt(str[1]));

				newcells[x][y] = parseInt(str[i]) == 1;
			}

			cells = newcells;
		}
	}
	else
	{
		alert("Invalid input");
	}

}*/

function onUpdateSpeed(e)
{
	simspeed = speedinput.value;
}


//Mouse buttons are defined as bit masks
var mouseleft = 1;    //00001
var mouseright = 2;   //00010
var mousemiddle = 4;  //00100
var mousefour = 8;    //01000
var mousefive = 16;   //10000

//m1 and m2 would produce 1 | 2 = 00011
//If we want to check for m1 then:
// 3 & 1 = 00001
// 3 & 2 = 00010
// 3 & 4 = 00000

function onMouseDown(e)
{
	m1down = ((e.buttons & mouseleft) == mouseleft);
	m2down = ((e.buttons & mouseright) == mouseright);
}

function onMouseUp(e)
{
	m1down = ((e.buttons & mouseleft) == mouseleft);
	m2down = ((e.buttons & mouseright) == mouseright);
}

//Updates mouse position every time the mouse is moved, handles mousemove event on the window
function onMouseMove(e)
{
	var pos = translateCoordinates(canvas, e.pageX - window.scrollX, e.pageY - window.scrollY);
	mx = pos.x;
	my = pos.y;
}

//Translate page coordinates to coordinates relative to an element
function translateCoordinates(elem, pageX, pageY)
{
	var pos = elem.getBoundingClientRect();

	return {
		x: pageX - pos.left,
		y: pageY - pos.top
	};
}
