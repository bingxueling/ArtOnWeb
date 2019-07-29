/*!
 * artonweb的核心逻辑.
 * 包括使用数据类生成内容标签的方法,瀑布流生成,探底数据刷新和看图浮层配置.
 * 本项目使用了jquery,masonry,imagesloaded,photoswipe和FileSaver开源项目.
 * MIT License
 * by bingxueling | UIDesignScience
*/


// 获取屏幕信息, 初始化图库索引及图片数
var screenWidth = $(window).width();
//记录页面宽度, 用于计算滚动条宽度
var pageWidth = screenWidth;
//滚动条宽度
var scrollbarWidth = 0;
var galleryIndex = 0;
const galleryLength = myData.gallery.length;

// 设置头部的设计师信息, 返回值为HTML标签字符串
function getProfile() {
	var profile = myData.designer;
	var profileHtml = "";
	if (profile.name) {
		profileHtml += `<h1 id="my-name" class="title">${profile.name}</h1>`;
		// 修改页面的title
		$('head title').text(profile.name + "-ArtOnWeb");
	}
	profileHtml += '<p id="my-tag" class="text-body">';
	for (var i = 0; i < profile.tag.length; i++) {
		if (profile.tag[i]) {
			profileHtml += `<span>${profile.tag[i]}</span>`;
		}
	}
	profileHtml += '</p>';
	// SVG内嵌到Html中, 可进行动态灌色
	if (profile.phone) {
		profileHtml += `
			<a id="my-phone" class="subtitle" href="tel:${profile.phone}">
				<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
					<path d="M30.795 32.994l-2.3 7.498a34.912 34.912 0 0 1-12.804-8.298c-4.001-4-6.702-8.399-8.302-12.798l8.611-2.2V2.2L3.187 0c-6.301 9.898-3.1 25.395 8.203 36.593C22.593 47.99 37.997 51.09 48 44.79l-2-11.797H30.794z" fill-rule="evenodd"/>
				</svg>${profile.phone}
			</a>
		`;
	}

	if (profile.bg) {
		//通过js修改CSS样式表中的root样式表, root始终置于第一位
		// 操作cssRules会触发COSR规则, chrome64后不支持本地执行, 修改主题暂时放弃此方式
		// document.styleSheets[0].cssRules[0].style.setProperty('--color-primary-background', profile.bg);
		$('#profile, #content .decoration').css("background-color", profile.bg);
	}

	if (profileHtml) {
		// console.log(profileHtml);
		return profileHtml;
	}
}

// 瀑布流列表获取image的方法, 返回6个标准的瀑布流项, 返回值为HTML标签字符串
function getImages() {
	var gallery = myData.gallery;
	var galleryHtml = "";
	for (var i = 0; i < 6 && galleryIndex < galleryLength; i++) {
		// 使用字符模板返回瀑布流单项, 动画延时采用随机算法, img的高度使用图片尺寸数据动态计算
		var imgHeight = gallery[galleryIndex].h / gallery[galleryIndex].w * 100;
		//控制首页作品的最高显示高度为宽度的3倍.
		imgHeight = imgHeight <= 300 ? imgHeight : 300;
		galleryHtml += `
			<figure class="gallery-item animate-up animate-delay-${Math.floor(Math.random()*4)+1}">
				<div class="img-wrapper" style="padding-bottom:${imgHeight}%;">
					<img src="${gallery[galleryIndex].src}"/>
				</div>
			</figure>
		`;
		galleryIndex++;
	}
	if (galleryHtml) {
		// console.log(galleryHtml);
		return galleryHtml;
	}
}

// 设置原图查看浮层
function initOverlayout() {
	//绑定点击事件
	$('#gallery').on("click", ".img-wrapper", function(){
		console.log($(this).children("img").attr("src"));
		// 清除底部窗口的滚动, 增加右padding保持页面稳定
		$('html').css("overflow", "hidden");
		$('html, #logo').css("padding-right", scrollbarWidth + "px");
		// 配置photoswipe插件
		var pswpElement = document.querySelectorAll('.pswp')[0];
		var imgIndex = $(this).parent().index();
		console.log("parent().index():" + imgIndex);
		var options = {
			// 功能
			index: imgIndex,
			bgOpacity: 0.8,
			closeOnScroll: false,
			loop: false,
			history: false,
			// 浮层动画, 如果getThumbBoundsFn性能与稳定性不加, 需要重新使用showHideOpacity
			showHideOpacity: false,
			getThumbBoundsFn: function(index) {
				console.log("index:" + index);
				// 定位被点击的img,[0]是一个DOM对象
				var thumbnail = $('.gallery-item').eq(index).find('img')[0];
				// 获取当前窗口的滚动位置
				var scrollTop = $(window).scrollTop();
				// 瀑布流数据时懒加载, 需要判断一下当前是否已经加载了弹窗收起时当前的img对象
				if (thumbnail) {
					rect = thumbnail.getBoundingClientRect();
					return {x:rect.left, y:rect.top + scrollTop, w:rect.width};
				}
				// 如果没有加载, 会返回一个向正下方缩小的动画
				return {x:screenWidth/2, y:$(document).height(), w:0};
			},
			//UI
			zoomEl: false,
			fullscreenEl: false,
			shareEl: false
		};
		var pswpOverlayout = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, myData.gallery, options);
		// 监听浮层关闭, 重新开启底部窗口滚动
		pswpOverlayout.listen('close', function() {
			$('html, #logo').css("padding-right", "");
			$('html').css("overflow", "");
		});
		pswpOverlayout.init();
	});
}

// 配置公众号资料
function initQRCode() {
	// 移动端显示二维码, pc端鼠标悬浮会有二维码
	if(/Android|webOS|iPhone|iPod|BlackBerry/i.test(navigator.userAgent)) {
		console.log("移动端");
	} else {
		console.log("pc端");
		$('#logo').on("mouseenter", function(){
			console.log("logo被触碰!");
			$('.logo-QR').fadeToggle(300);
		});
		$('#logo').on("mouseleave", function(){
			console.log("logo触碰结束!");
			$('.logo-QR').fadeToggle(300);
		});
	}
}

// 进行布局初始化, 加载第一波image和初始化瀑布流插件
$(function() {
	//加载头部个人信息
	$('#profile').append(getProfile());
	//加载第一批作品图
	$('#gallery').append(getImages());

	// 初始化瀑布流控件
	var masonryGrid = $('#gallery').masonry({
		// options
		itemSelector: '.gallery-item',
		columnWidth: $('#gallery').find('.gallery-item')[0],
		percentPosition: true,
		horizontalOrder: false,
		resize: true,
		transitionDuration: 0
	});

	//内部函数, 向瀑布流中增加新的作品
	var appendMasonry = function() {
		var galleryItem = getImages();
		if (galleryItem) {
			var imasonryItems = $(galleryItem);
			masonryGrid.append(imasonryItems);
			masonryGrid.masonry('appended', imasonryItems);
			return true;
		} else {
			console.log("没有更多作品!");
			return false;
		};
	};

	//判断当第一批作品能否激活屏幕滚动, 若未激活则继续加载更多作品到屏幕可滚动为止, 为了防止死循环, 最多验证5次
	var pageHeight = $(document).height();
	var windowHeight = $(window).height();
	console.log("pageHeight:" + pageHeight + ", windowHeight:" + windowHeight);
	for(var i = 0; i < 5; i++ ) {
		pageHeight = $(document).height();
		console.log("首次加载检测, 第" + i + "次, 当前pageHeight:" + pageHeight);
		//作品动画会影响页面高度的最终结果, 大概偏差70px, 故这里多增加100px的安全值
		if (pageHeight > windowHeight + 100) {
			break;
		}
		if (!appendMasonry()) {
			break;
		}
	}

	pageWidth = $(document).width();
	scrollbarWidth = screenWidth - pageWidth;
	$('#log').append(`<h2>屏幕宽: ${screenWidth}, 页面宽: ${pageWidth}</h2>`);

	// 如果你不希望显示公众号浮层,可以注释掉这句
	initQRCode();

	// 配置原图查看功能
	initOverlayout();
	
	// 页面滚动到底加载新数据
	$(window).scroll(function() {
		var scrollTop = $(this).scrollTop();
		pageHeight = $(document).height();
		$('#log h1').text("scrollTop:" + scrollTop + ", pageHeight:" + pageHeight + ", windowHeight:" + windowHeight);
		if(scrollTop + windowHeight + 400 >= pageHeight) {
			appendMasonry();
		}
	});
});
