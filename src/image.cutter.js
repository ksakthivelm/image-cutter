(function(W){	
	var utils	=	function(){};
		
	utils.prototype.getCSSPrefix	=	function()
	{
		var styles = window.getComputedStyle(document.documentElement, '');
		var preFixs	=	{'webkit': 'webkit', 'moz': 'Moz', 'ms' : 'ms'};
		var pre = (Array.prototype.slice
			.call(styles)
			.join('') 
			.match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
		  )[1];
		
		return preFixs[pre];
	}
	
	utils.prototype.calculateSize	=	function(origwidth, origheight, newwidth, newheight) 
	{		
		var ratio;	
		origwidth	=	parseFloat(origwidth);
		origheight	=	parseFloat(origheight);			
		ratio		=	origwidth/origheight;
		
		newheight	=	parseFloat(newheight);
		newwidth	=	parseFloat(newwidth);
		
		if(newheight > 0)
			return ratio * newheight;
		else if(newwidth > 0)
			return newwidth/ratio;		
	}
	
	var imageCutter	=	function(element, settings)
	{
		var defaults	=	{
			fit: true,
			minScale: 1,
			defaultScale: 1,
			maxScale: 3,
			increment: 0.1,
			rotatePerStep: 10, // deg
			contain: true,
			CSSTransition: true, // ms
			CSSDelay: 200, // ms
			onChange: function(){},
			onLoaded: function(){}
			
		};
		
		settings	=	settings || {};
		this.settings	=	defaults;
		
		for(var k in defaults)
		{			
			if(settings.hasOwnProperty(k))
				this.settings[k]	=	settings[k];			
		}
		
		this.width		=	element.offsetWidth;
		this.height		=	element.offsetHeight;						
		this.element	=	element;				
	}
	
	imageCutter.prototype	=	Object.create(utils.prototype);
	imageCutter.prototype.constructor	=	imageCutter;
	imageCutter.prototype.init	=	function(url)
	{
		var self = this;
		self.touch		=	('ontouchstart' in window);
		
		self.events		=	{
			START_EVENT :	self.touch ? 'touchstart' : 'mousedown',
			MOVE_EVENT	:	self.touch ? 'touchmove' : 'mousemove',
			END_EVENT	:	self.touch ? 'touchend' : 'mouseup'
		};
		
		self.cssPrefix	=	self.getCSSPrefix();
		
		if(url)
			self.loadImage(url);
	}
	
	imageCutter.prototype.loadImage	=	function(url)
	{
		var self	=	this;
		
		self.showLoader();		
		var img =	new Image();
		img.onload = function(){
			self.hideLoader();
			self.imgWidth	=	img.width;
			self.imgHeight	=	img.height;
			self.setImage(url);
		};
		
		img.src	=	url;
	
	}
	
	imageCutter.prototype.showLoader	=	function()
	{
		var self	=	this;
		self.c	=	self.element.getAttribute('class');		
		self.element.setAttribute('class', self.c+' loading');
		self.loaderDiv	=	document.createElement('div');
		self.loaderDiv.setAttribute('class', 'loader');
		self.element.appendChild(self.loaderDiv);
		
	}
	
	imageCutter.prototype.hideLoader	=	function()
	{
		var self	=	this;		
		self.element.setAttribute('class', self.c);
		self.element.removeChild(self.loaderDiv);
	}
	
	imageCutter.prototype.setImage	=	function(url)
	{
		var self	=	this,
			new_w,
			new_h,
			new_x = 0,
			new_y = 0;
		
		self.element.innerHTML	=	'';
		self.imgElement		=	document.createElement('img');
		
		self.imgElement.setAttribute('src', url);
		self.imgElement.style.position	=	'absolute';
		
		// fit the image to element
		
		if(self.settings.fit)
		{
			self.settings.minScale	=	parseFloat((self.width/self.imgWidth).toPrecision(4));
			self.imageScale	=	parseFloat((self.width/self.imgWidth).toPrecision(4));			
			new_w	=	self.width;
		}
		else
		{	
			new_w	=	self.settings.defaultScale*self.imgWidth;
			
			if(self.settings.defaultScale < self.settings.minScale)
				self.settings.minScale	=	self.settings.defaultScale;
			
			self.imageScale	=	self.settings.defaultScale;
		}
		
		new_h	=	self.calculateSize(self.imgWidth, self.imgHeight, new_w);
		
		new_y	=	(self.height - new_h)/2;
		new_x	=	(self.width - new_w)/2;
		
		self.imgElement.style.width		=	new_w + 'px';
		self.imgElement.style.height	=	new_h + 'px';
		self.imgElement.style.left		=	new_x + 'px';
		self.imgElement.style.top		=	new_y + 'px';
		
		self.element.appendChild(self.imgElement);
		
		var x_pos = 0,
			y_pos = 0,
			element_x = 0,
			element_y = 0,			
			startDrag = null;
		
		function mouseUp()
		{
			window.removeEventListener('mousemove', mouseMove, false);
			startDrag = null;
			self.update();
			return false;
		}
		
		function mouseMove(e)
		{			
			if(startDrag !== null)
			{
				var pos = getClientPosition(e);
				x_pos	=	pos.x;
				y_pos	=	pos.y;
				var l = (x_pos - element_x),
					t = (y_pos - element_y);
				
				if(self.settings.contain)
				{
					var img_w = self.imgElement.width,
						img_h = self.imgElement.height;
			
					if(self.width >= img_w)
						l = self.imgElement.offsetLeft;
					else
					{
						if(l > 0)
							l = 0;
						else if(img_w+l < self.width)
							l = self.imgElement.offsetLeft;
					}	
					
					if(self.height >= img_h)
						t = self.offsetTop;
					else
					{
						if(t > 0)
							t = 0;
						else if(img_h+t < self.height)
							t = self.imgElement.offsetTop;
					}
				}
				
				self.imgElement.style.left	=	l + 'px';
				self.imgElement.style.top	=	t + 'px';				
			}	
		}
		
		function mouseDown(e)
		{			
			startDrag	=	this;
			window.addEventListener(self.events.MOVE_EVENT, mouseMove, false);
			window.addEventListener(self.events.END_EVENT, mouseUp, true);
			var pos = getClientPosition(e);
			
			x_pos	=	pos.x;
			y_pos	=	pos.y;
			element_x = x_pos - startDrag.offsetLeft;
			element_y = y_pos - startDrag.offsetTop;			
			e.preventDefault();
		}
		
		function getClientPosition(e)
		{
			var x_pos = 0, y_pos = 0;
						
			if(self.touch)
			{
				x_pos	=	e.originalEvent ? e.originalEvent.changedTouches[0].pageX : e.changedTouches[0].pageX;
				y_pos	=	e.originalEvent ? e.originalEvent.changedTouches[0].pageY : e.changedTouches[0].pageY;
			}
			else
			{
				x_pos	=	(window.event) ? window.event.clientX : e.pageX;
				y_pos	=	(window.event) ? window.event.clientY : e.pageY;
			}
			
			return {
				x : x_pos, 
				y : y_pos
			};
		}
		
		self.imgElement.addEventListener(self.events.START_EVENT, mouseDown, false);
		
		//pinch event
		if(self.touch && W.Hammer)
		{
			
			var hammertime = new W.Hammer(self.imgElement, {});
			
			hammertime.get('pinch').set({ enable: true, threshold: 1 });
			
			hammertime.on('pinch', function(ev) {
				alert('pinch');
			});
		}
		
		self.settings.onLoaded.call(self, self.getCoordiantes());
	}
	
	imageCutter.prototype.getCoordiantes	=	function()
	{
		var self = this;
		
		return {
			x: self.imgElement.offsetLeft,
			y: self.imgElement.offsetTop,
			w: self.imgElement.width,
			h: self.imgElement.height,
			r: self.imageRotate ? self.imageRotate : 0,
			s: self.imageScale ? self.imageScale : 0
		};
	}
	
	imageCutter.prototype.update	=	function()
	{
		var self = this;
		
		self.settings.onChange.call(self, self.getCoordiantes());
	}
	
	imageCutter.prototype.next	=	function()
	{
		var self = this,
		cur_scale = self.imgElement.width/self.imgWidth;		
		self.setScale(cur_scale+self.settings.increment);
		
	}
	
	imageCutter.prototype.prev	=	function()
	{
		var self = this,
		cur_scale = self.imgElement.width/self.imgWidth;
		self.setScale(cur_scale-self.settings.increment);		
	}
	
	imageCutter.prototype.rotate	=	function(dir)
	{
		var self = this,
		cur_deg = self.imageRotate ? self.imageRotate : 0,
		new_rotate = dir === 'RClock' ? cur_deg-self.settings.rotatePerStep : cur_deg+self.settings.rotatePerStep;
		
		new_rotate = new_rotate < 0 ? 360 + new_rotate : new_rotate;
		
		self.setRotation(new_rotate);		
	}
	
	imageCutter.prototype.setRotation	=	function(angle)
	{
		var self = this;
		
		if(angle < 0 || angle >= 360)
			angle = 0;
		
		self.imageRotate	=	angle;
		var transition	=	self.cssPrefix + 'Transform';
		
		self.imgElement.style[transition]	=	'rotate('+angle+'deg)';
		self.update();
	}
	
	
	imageCutter.prototype.setScale	=	function(scale)
	{
		var self = this,
		
		scale = parseFloat(scale.toPrecision(4));

		if(scale > self.settings.maxScale || scale < self.settings.minScale)
			return false;
		
		self.imageScale	=	scale;
		
		var new_w	=	scale*self.imgWidth,		
			new_h	=	self.calculateSize(self.imgWidth, self.imgHeight, new_w),								
			old_x	=	self.imgElement.offsetLeft,
			old_y	=	self.imgElement.offsetTop,
			old_w	=	self.imgElement.width,
			old_h	=	self.imgElement.height,
			l, t;
										
		if(new_w < old_w)
		{	
			l	=	old_x + (old_w - new_w)/2;
			
			if(l > 0 & new_w > self.width)
				l =  0;
			else
			{
				var l1	=	Math.abs(l) + self.width;
				
				if(l1 > new_w)
					l += (l1 - new_w);
			}
		}
		else
			l	=	old_x - (new_w - old_w)/2;
		
		if(new_h < old_h)
		{
			t	=	old_y + (old_h - new_h)/2;
			
			if(t > 0 & new_h > self.height)
				t =  0;
			else
			{
				var t1	=	Math.abs(t) + self.height;
				
				if(t1 > new_h)
					t += (t1 - new_h);
			}
		}
		else
			t	=	old_y - (new_h - old_h)/2;
					   
		if(new_w <= self.width)
			l	=	(self.width - new_w)/2;
		
		if(new_h <= self.height)
			t	=	(self.height - new_h)/2;
		
		if(self.settings.CSSTransition)
		{	
			var transition	=	self.cssPrefix + 'Transition';		
			self.imgElement.style[transition]	=	'all '+(self.settings.CSSDelay/1000)+'s';
			setTimeout(function(){self.imgElement.style[transition] = 'none'}, self.settings.CSSDelay);
		}
		
		self.imgElement.style.width	=	new_w + 'px';
		self.imgElement.style.height=	new_h + 'px';
		self.imgElement.style.left	=	l + 'px';
		self.imgElement.style.top	=	t + 'px';
		self.update();				
	}
	
	imageCutter.prototype.isContainerFilled	=	function()
	{
		var self	=	this,
			angle	=	self.imageRotate ? self.imageRotate : 0,
			img_w	=	self.imgElement.width,
			img_h	=	self.imgElement.height,
			e_w		=	self.width,
			e_h		=	self.height,
			ret		=	true;
		
		try 
		{
			if(angle === 0)
			{
				if(e_w > img_w || e_h > img_h)
					throw {error: 1};
			}
			else
			{
				var radians			=	angle * (Math.PI/180),
					elem_rotated_h	=	e_h * Math.abs(Math.cos(radians)) + e_w * Math.abs(Math.sin(radians)),
					elem_rotated_w	=	e_w * Math.abs(Math.cos(radians)) + e_h * Math.abs(Math.sin(radians));

				if(elem_rotated_w > img_w || elem_rotated_h > img_h)
					throw {error: 2};
				
				//check left & top value to area
				var img_rotated_h = img_h * Math.abs(Math.cos(radians)) + img_w * Math.abs(Math.sin(radians)),
					img_rotated_w = img_w * Math.abs(Math.cos(radians)) + img_h * Math.abs(Math.sin(radians)),
					diff_w		  = (img_rotated_w - img_w)/2,
					diff_h		  = (img_rotated_h - img_h)/2,
					img_x		  = Math.abs(self.imgElement.offsetLeft),
					img_y		  = Math.abs(self.imgElement.offsetTop);
				
				console.log(img_y);
				console.log(diff_h);
				
				if(img_x < diff_w || img_x > (img_w - diff_w))
					throw {error: 3};
				
				if(img_y < diff_h || img_y > (img_h - diff_h))
					throw {error: 4};
				
				console.log(img_y);
				console.log(diff_h);
			}
			
		}
		catch(e)
		{
			console.log(e);
			ret = false;
		}
		
		console.log(ret);		
		
		
		return ret;		
	}
	
	W.imageCutter = imageCutter;
	
})(window);