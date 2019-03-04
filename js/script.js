/*!
 * artonweb的核心逻辑.
 * 包括使用数据类生成内容标签的方法,瀑布流生成,探底数据刷新和看图浮层配置.
 * 本项目使用了jquery,masonry,imagesloaded,photoswipe和FileSaver开源项目.
 * MIT License
 * by bingxueling | UIDesignScience
*/


// 获取屏幕信息, 初始化图库索引及图片数
var cw = $(window).width();
var galleryIndex = 0;
const galleryLength = myData.gallery.length;

// 设置头部的设计师信息, 返回值为HTML标签字符串
function getProfile() {
	var profile = myData.designer;
	var profileHtml = "";
	if (profile.name) {
		profileHtml += `<h1 id="my-name" class="title">${profile.name}</h1>`;
		// 修改页面的title
		$('head title').text(profile.name + "-Art on web");
	};
	profileHtml += '<p id="my-tag" class="text-body">';
	for (var i = 0; i < profile.tag.length; i++) {
		if (profile.tag[i]) {
			profileHtml += `<span>${profile.tag[i]}</span>`;
		};
	};
	profileHtml += '</p>';
	if (profile.phone) {
		profileHtml += `<a id="my-phone" class="subtitle" href="tel:${profile.phone}"><img src="skin/icon_phone.svg"/>${profile.phone}</a>`;
	};

	if (profile.bg) {
		$('#profile').css("background-color", `${profile.bg}`);
		$('#content .decoration').css("background-color", `${profile.bg}`);
	};

	if (profileHtml) {
		console.log(profileHtml);
		return profileHtml;
	};
}

// 瀑布流列表获取image的方法, 返回6个标准的瀑布流项, 返回值为HTML标签字符串
function getImages() {
	var gallery = myData.gallery;
	var galleryHtml = "";
	for (var i = 0; i < 6 && galleryIndex < galleryLength; i++) {
		// 使用字符模板返回瀑布流单项, 动画延时采用随机算法
		galleryHtml += `<div class="gallery-item animate-up animate-delay-${Math.floor(Math.random()*4)+1}"><img src="${gallery[galleryIndex++].src}"/></div>`;
	};
	if (galleryHtml) {
		console.log(galleryHtml);
		return galleryHtml;
	};
}

// 设置原图查看浮层
function initOverlayout() {
	//绑定点击事件
	$('#gallery').on("click", "img", function(){
		console.log($(this).attr("src"));
		// 清除底部窗口的滚动
		$('html').css("overflow", "hidden");
		$('.details img').attr("src", $(this).attr("src"));
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
				// 定位被点击的img
				var thumbnail = $('.gallery-item').eq(index).children('img')[0];
				// 获取当前窗口的滚动位置
				var scrollTop = $(window).scrollTop();
				// 瀑布流数据时懒加载, 需要判断一下当前是否已经加载了弹窗收起时当前的img对象
				if (thumbnail) {
					rect = thumbnail.getBoundingClientRect();
					return {x:rect.left, y:rect.top + scrollTop, w:rect.width};
				};
				// 如果没有加载, 会返回一个向正下方缩小的动画
				return {x:cw/2, y:$(document).height(), w:0};
			},
			//UI
			zoomEl: false,
			fullscreenEl: false,
			shareEl: false
		};
		var pswpOverlayout = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, myData.gallery, options);
		// 监听浮层关闭, 重新开启底部窗口滚动
		pswpOverlayout.listen('close', function() {
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
	$('#log').append(`<h1>${cw}</h1>`);
	//加载头部个人信息和第一波作品图
	$('#profile').append(getProfile());
	$('#gallery').append(getImages());

	// 如果你不希望显示公众号浮层,可以注释掉这句
	initQRCode();

	// 配置原图查看功能
	initOverlayout();

	// 初始化瀑布流控件, 实用imagesLoaded插件保证图片被下载完成再进行布局
	var masonryGrid = $('#gallery').imagesLoaded(function() {
		console.log("imagesLoaded");
		masonryGrid.masonry({
			// options
			itemSelector: '.gallery-item',
			columnWidth: $('#gallery').find('.gallery-item')[0],
			percentPosition: true,
			horizontalOrder: false,
			transitionDuration: 0
		});
	});
	
	// 页面滚动到底加载新数据
	$(window).scroll(function() {
		var scrollTop = $(this).scrollTop();
		var scrollHeight = $(document).height();
		var windowHeight = $(this).outerHeight(true);
		$('#log h1').text("scrollTop:" + scrollTop + ",scrollHeight" + scrollHeight + ",windowHeight" + windowHeight);
		if(scrollTop + windowHeight + 100 >= scrollHeight) {
			var imasonryItems = $(getImages());
			masonryGrid.append(imasonryItems);
			masonryGrid.imagesLoaded(function() {
				masonryGrid.masonry('appended', imasonryItems);
				console.log("新增完成");
			});
		}
	})
});
