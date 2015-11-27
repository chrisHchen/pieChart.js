//requestAnimationFrame polyfill
(function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||    // name has changed in Webkit
                                      window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16.7 - (currTime - lastTime));
            var id = window.setTimeout(function() {
                callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }
    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }
}());

// code start here
(function($){
	$.fn.pieChart = function(opt, callback){
		var radiusPercent = 0.5 || opt.radius,
		 	maxSeperateDistance = 24,
		 	currentSeperateDistance = 0,
		 	seperateStep = 5,
		 	radius = 0, //for init animation
		 	radiusStep = 4, //for init animation
		 	that = this,
		 	canvas = this[0],
		 	canvasW = canvas.width,
		 	canvasH = canvas.height,
		 	ctx,
		 	font = "bold 12px 'Trebuchet MS', Arial, Verdana, sans-serif",
		 	fontOnTransparentRect = "normal 14px 'Trebuchet MS', Arial, Verdana, sans-serif",
		 	currentSeperateSlice = -1,
		 	currentHoverSlice = -1,
		 	totalFigure = 0,
		 	chartData = [],
		 	imageData,
		 	descHeight, 
		 	hoverPadding = 30,
		 	centerX,
		 	centerY,
		 	maxRadius,
		 	timer,
		 	PI = Math.PI

		init()

		function init(){
			if ( typeof canvas.getContext === 'undefined' ) return;
			var currentPercent = 0 //(from 0 to 1)
			ctx = canvas.getContext('2d'),
			centerX = canvasW/2
			centerY = canvasH/2
			maxRadius = Math.min(centerX, centerY) * radiusPercent
			ctx.font = font
			for(var x in opt.data.figure){
				totalFigure += opt.data.figure[x]
			}
			for(var x in opt.data.figure){
				chartData[x] = []
				chartData[x]['figure'] = opt.data.figure[x]
				chartData[x]['percent'] = (opt.data.figure[x]/totalFigure * 100).toFixed(2)
				chartData[x]['desc'] = opt.data.desc[x]
				chartData[x]['origin'] = opt.color.origin[x]
				chartData[x]['hover'] = opt.color.hover[x]
				chartData[x]['startAngle'] = 2 * PI * currentPercent
				currentPercent += chartData[x]['figure'] / totalFigure
				chartData[x]['endAngle'] = 2 * PI * currentPercent
				chartData[x]['descAll'] = chartData[x]['desc'] + ':' + chartData[x]['figure'] + ' ('+  chartData[x]['percent']  +'%)'
				chartData[x]['descWidth'] = ctx.measureText(chartData[x]['descAll']).width * 1.2
			}
			ctx.font = fontOnTransparentRect
			descHeight = ctx.measureText(chartData[x]['desc'].substring(0,1)).width * 2.8 * 2
			animateInitPieChart()
			
		}

		function animateInitPieChart(){
			var _run = function(){
				radius += radiusStep;
				drawPieChart()
				if(radius < maxRadius){
					requestAnimationFrame(_run)
				} else{
					//due to high dpi, here we use canvas.width instead of canvasW
					imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
					if(chartData.length>1){
						that.click(clickHandler)
					}
					that.mousemove(moveHandler)
				}
			}
			_run()
		}

		function drawPieChart(){
			ctx.clearRect(0, 0, canvasW, canvasH)
			drawBackground()
			for(var x in chartData){
				if(x !== currentSeperateSlice){
					drawSlice(x)
					writeDesc(x)
				}
			}
			//draw the seperated slice last so its shadow doesn't get painted over.
			ctx.save()
			if(currentSeperateSlice !== -1){
				drawSlice(currentSeperateSlice)
				writeDesc(currentSeperateSlice)
			}
			
			drawDecorationalCircle(radius*1.1)
			
			ctx.restore()
		}

		function clickHandler(e){
			var vector = getPositionToCenter(e), 
				distanceFromCenter = Math.sqrt( Math.pow( Math.abs(vector.x), 2) + Math.pow( Math.abs(vector.y), 2)),
				clickAngle
			if( distanceFromCenter < radius){
				that.off('mousemove')
				clickAngle = Math.atan2(vector.y, vector.x ) + PI/2
				if(clickAngle < 0) clickAngle = 2 * PI + clickAngle
				for(var x in chartData){
					if(clickAngle >= chartData[x]['startAngle'] && clickAngle < chartData[x]['endAngle']){
						toggleSlice(x)
						return
					}
				}
			}
			pullIn()
		}

		function toggleSlice(index){
			if(index === currentSeperateSlice){
				pullIn()
			}else{
				pullOut(index)
			}
		}

		function pullOut(index){
			// Exit if we're already in the middle of pulling out this slice
    		if ( currentSeperateSlice === index ) return

    		currentSeperateSlice = index;
    		currentSeperateDistance = 0;
			var _run = function(){
				currentSeperateDistance += 4
				drawPieChart()
				
				if(currentSeperateDistance < maxSeperateDistance){
					requestAnimationFrame(_run)}else{
						imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
						that.mousemove(moveHandler)
						callback(chartData[currentSeperateSlice]['figure'], chartData[currentSeperateSlice]['percent']+'%',
							chartData[currentSeperateSlice]['origin'])
					}
			}
			_run()
		}

		function pullIn(){
			currentSeperateSlice = -1
			currentSeperateDistance = 0
			drawPieChart()
			imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
		}

		function moveHandler(e){
			var vector = getPositionToCenter(e), 
				distanceFromCenter = Math.sqrt( Math.pow( Math.abs(vector.x), 2) + Math.pow( Math.abs(vector.y), 2)),
				clickAngle
			if( distanceFromCenter < radius){
				clickAngle = Math.atan2(vector.y, vector.x ) + PI/2
				if(clickAngle < 0) clickAngle = 2 * PI + clickAngle
				for(var x in chartData){
					if(clickAngle >= chartData[x]['startAngle'] && clickAngle < chartData[x]['endAngle']){
						currentHoverSlice = x
						ctx.putImageData(imageData,0,0)
						drawSlice(x)
						drawHoverDesc(x, distanceFromCenter ,clickAngle, vector)
					}
				}
			}else{
				ctx.putImageData(imageData,0,0)
				currentHoverSlice = -1
			}
		}

		// get the x and y position of the mouse cursor relative to the center of pie
		function getPositionToCenter(e){
			// get the x and y position of the mouse cursor relative to the leftTop canvas
			var mouseX = e.pageX - that.offset().left,
				mouseY = e.pageY - that.offset().top,
			// get the x and y position of the mouse cursor relative to the center of pie
				xFromCenter = mouseX - canvasW/2,
				yFromCenter = mouseY - canvasH/2
			return {
				x: xFromCenter,
				y: yFromCenter
			}
		}

		function writeDesc(index){
			var startAngle = chartData[index]['startAngle'] - PI/2, //   start the chart at 12 o'clock instead of 3 o'clock
				endAngle = chartData[index]['endAngle'] - PI/2,
				midAngle = (startAngle + endAngle)/2,
				text = chartData[index]['desc'], 
				textWidth = ctx.measureText(text).width,
				startX = 0,
				startY = 0

			ctx.strokeStyle = chartData[index]['origin']
			ctx.fillStyle = chartData[index]['origin']
			ctx.font = font
			ctx.textAlign = 'center'
			ctx.beginPath()
			if(currentSeperateSlice === index){
				var actualSeperateDistance = currentSeperateDistance * easeOut( currentSeperateDistance/maxSeperateDistance, .8 )
				
				startX = Math.cos(midAngle) * actualSeperateDistance;
      			startY = Math.sin(midAngle) * actualSeperateDistance;
      			
			}
			ctx.moveTo(canvasW/2 + Math.cos(midAngle) * radius + startX, canvasH/2 + Math.sin(midAngle) * radius + startY)
			ctx.lineTo(canvasW/2 + Math.cos(midAngle) * radius * 1.3 + startX, canvasH/2 + Math.sin(midAngle) * radius * 1.25 + startY)
			if(midAngle > -PI/2 && midAngle < PI/2){
				ctx.lineTo(canvasW/2 + Math.cos(midAngle) * radius * 1.3 + startX + radius*0.1, canvasH/2 + Math.sin(midAngle) * radius * 1.25 + startY)
				ctx.fillText(text, canvasW/2 + Math.cos(midAngle) * radius * 1.3 + startX + radius*0.1 + textWidth*0.8, canvasH/2 + Math.sin(midAngle) * radius * 1.25 + startY)
			}else if(midAngle >= PI/2 && midAngle < PI * 1.5){
				ctx.lineTo(canvasW/2 + Math.cos(midAngle) * radius * 1.3 + startX - radius*0.1, canvasH/2 + Math.sin(midAngle) * radius * 1.25 + startY)
				ctx.fillText(text, canvasW/2 + Math.cos(midAngle) * radius * 1.3 + startX - radius*0.1 - textWidth*0.8, canvasH/2 + Math.sin(midAngle) * radius * 1.25 + startY)
			}
			ctx.stroke()	
		}

		function drawHoverDesc(index, distance, clickAngle, vector){
			drawTransparentRect(canvasW/2 + Math.cos(clickAngle - PI/2) * distance + hoverPadding, canvasH/2 + Math.sin(clickAngle - PI/2) * distance - descHeight/2, chartData[index]['descWidth'], descHeight)
			drawDescOnTransparentRect(index, canvasW/2 + Math.cos(clickAngle - PI/2) * distance + hoverPadding, canvasH/2 + Math.sin(clickAngle - PI/2) * distance - descHeight/2)
		}

		function drawTransparentRect(x, y, width, height){
			ctx.save()
			ctx.beginPath()
			ctx.fillStyle='rgba(0, 0, 0, .4)'
			ctx.fillRect(x, y, width, height)
			ctx.restore()
		}

		function drawDescOnTransparentRect(index, x, y){
			ctx.save()
			ctx.font = fontOnTransparentRect
			ctx.fillStyle='#fff'
			ctx.textAlign = 'left'
			ctx.textBaseline = 'top'
			ctx.fillText(opt.data.cap, x + 10, y)
			ctx.fillText(chartData[index]['descAll'], x + 10, y + descHeight/2)
			ctx.restore()
		}

		function drawSlice(index){
			var startAngle = chartData[index]['startAngle'] - PI/2, //   start the chart at 12 o'clock instead of 3 o'clock
				endAngle = chartData[index]['endAngle'] - PI/2,
				midAngle = (startAngle + endAngle) / 2,
				startX = canvasW/2,
				startY = canvasH/2
			if(index !== currentSeperateSlice){
				if(index === currentHoverSlice){
					ctx.fillStyle = chartData[index]['hover']
				}else{
					ctx.fillStyle = chartData[index]['origin']
				}
			}else{
				var actualSeperateDistance = currentSeperateDistance * easeOut( currentSeperateDistance/maxSeperateDistance, .8 );
				startX = canvasW/2 + Math.cos(midAngle) * actualSeperateDistance;
      			startY = canvasH/2 + Math.sin(midAngle) * actualSeperateDistance;
				ctx.shadowOffsetX = 5;
      			ctx.shadowOffsetY = 5;
      			ctx.shadowBlur = 5;
      			ctx.fillStyle = chartData[index]['origin']
      			//drawDecorationalCircle(radius*1.1 + actualSeperateDistance)
			}
			ctx.beginPath()
			ctx.moveTo(startX, startY)
			ctx.arc(startX, startY, radius, startAngle, endAngle, false)
			ctx.lineTo(startX, startY)
			ctx.closePath()
			ctx.lineWidth = 1
			ctx.strokeStyle = '#fff'
			ctx.shadowColor = ( index == currentSeperateSlice ) ? 'rgba( 0, 0, 0, .3 )' : "rgba( 0, 0, 0, 0 )";
			ctx.stroke()
			ctx.fill()
		}

		function drawDecorationalCircle(radius){
			ctx.save()
			ctx.strokeStyle = '#ccc'
			ctx.beginPath()
			ctx.arc(canvasW/2, canvasH/2, radius, 0, PI*2, false)
			ctx.stroke()
			ctx.restore()
		}

		function drawBackground(){
			ctx.save()
			ctx.fillStyle = '#f7f7f7'
			ctx.strokeStyle = '#ccc'
			ctx.shadowColor = 'rgba( 0, 0, 0, 0 )'
			ctx.fillRect(0, 0, canvasW, canvasH)
			ctx.strokeRect(0, 0, canvasW, canvasH)
			ctx.restore()
		}

		function easeOut( ratio, power ) {
    		return ( Math.pow ( 1 - ratio, power ) + 1 );
  		}

		
	}
})(jQuery)