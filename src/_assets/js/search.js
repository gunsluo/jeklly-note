jQuery(document).ready(function($){
  const PAGE_SIZE = 5;
  var resizing = false,
    navigationWrapper = $('.cd-main-nav-wrapper'),
    navigation = navigationWrapper.children('.cd-main-nav'),
    searchForm = $('.cd-main-search'),
    pageContent = $('.cd-main-content'),
    searchTrigger = $('.cd-search-trigger'),
    coverLayer = $('.cd-cover-layer'),
    navigationTrigger = $('.cd-nav-trigger'),
    mainHeader = $('.cd-main-header'),
    suggestions = $('.cd-search-suggestions'),
    //postDom = suggestions.find('.news > ul');
    postDom = suggestions.find('.news');
  
  function checkWindowWidth() {
    var mq = window.getComputedStyle(mainHeader.get(0), '::before').getPropertyValue('content').replace(/"/g, '').replace(/'/g, "");
    return mq;
  }

  function checkResize() {
    if( !resizing ) {
      resizing = true;
      (!window.requestAnimationFrame) ? setTimeout(moveNavigation, 300) : window.requestAnimationFrame(moveNavigation);
    }
  }

  function moveNavigation(){
    var screenSize = checkWindowWidth();
    if ( screenSize == 'desktop' && (navigationTrigger.siblings('.cd-main-search').length == 0) ) {
      //desktop screen - insert navigation and search form inside <header>
      searchForm.detach().insertBefore(navigationTrigger);
      navigationWrapper.detach().insertBefore(searchForm).find('.cd-serch-wrapper').remove();
    } else if( screenSize == 'mobile' && !(mainHeader.children('.cd-main-nav-wrapper').length == 0)) {
      //mobile screen - move navigation and search form after .cd-main-content element
      navigationWrapper.detach().insertAfter('.cd-main-content');
      var newListItem = $('<li class="cd-serch-wrapper"></li>');
      searchForm.detach().appendTo(newListItem);
      newListItem.appendTo(navigation);
    }

    resizing = false;
  }

  function closeSearchForm() {
    searchTrigger.removeClass('search-form-visible');
    searchForm.removeClass('is-visible');
    coverLayer.removeClass('search-form-visible');
  }

  //add the .no-pointerevents class to the <html> if browser doesn't support pointer-events property
  ( !Modernizr.testProp('pointerEvents') ) && $('html').addClass('no-pointerevents');

  //move navigation and search form elements according to window width
  moveNavigation();
  $(window).on('resize', checkResize);

  //mobile version - open/close navigation
  navigationTrigger.on('click', function(event){
    event.preventDefault();
    mainHeader.add(navigation).add(pageContent).toggleClass('nav-is-visible');
  });

  searchTrigger.on('click', function(event){
    event.preventDefault();
    if( searchTrigger.hasClass('search-form-visible') ) {
      searchPost();
    } else {
      searchTrigger.addClass('search-form-visible');
      coverLayer.addClass('search-form-visible');
      searchForm.addClass('is-visible').one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(){
        searchForm.find('input[type="search"]').focus().end().off('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend');
      });
    }
  });

  //close search form
  searchForm.on('click', '.close', function(){
    closeSearchForm();
  });

  coverLayer.on('click', function(){
    closeSearchForm();
  });

  // press enter
  searchForm.keydown(function(event){
    if( event.which=='13' ) {
      return false;
    }

    if( event.which=='27' ) {
      return false;
    }

    return true;
  });
  searchForm.keyup(function(event){
    searchPost();
  });

  $(document).keyup(function(event){
    if( event.which=='27' ) closeSearchForm();
  });

  //upadate span.selected-value text when user selects a new option
  searchForm.on('change', 'select', function(){
    var selectedVal = $(this).children('option:selected').text();
    searchForm.find('.selected-value').text(selectedVal);
    searchPostByCategory(selectedVal.toLowerCase().trim(), 1)
  });

  postDom.on('click', 'a.previous, a.next', function(){
    var vals = $(this).attr("href").split('#');
    var type = parseInt(vals[0]);
    var content = vals[1];
    var page = parseInt(vals[2]);

    if (type == 1) {
      searchPostByContent(content, page);
    }else if(type == 2) {
      searchPostByCategory(content, page);
    }

    return false;
  });

  // add by jerrylou
  function searchPost() {
    var content = searchForm.find('input').val();
    if( content == "" ){
      postDom.html('');
      return;
    }
    searchPostByContent(content.toLowerCase().trim(), 1);
  }

  function nonePostWithDom(){
      postDom.html('<h3>News</h3><ul></ul>');
  }

  function searchPostByContent(content, page) {
    if( typeof postMap == "undefined" ) {
      return;
    }

    var posts = [];
    for(var key in postMap ) {
      var category = postMap[key];
      for(var idx in category){
        var post = category[idx];
        if( (post.title.toLowerCase().indexOf(content) >= 0) ||
          (post.subtitle.toLowerCase().indexOf(content) >= 0) ) {
          posts.push(post);
        }
      }
    }

    filterPostsByContentPage(posts, 1, content, page);
  }

  function searchPostByCategory(categoryName, page) {
    if( typeof postMap == "undefined" ) {
      return;
    }
    if( categoryName == "" ) {
      nonePostWithDom();
      return;
    }

    if( typeof postMap[categoryName] == "undefined" ) {
      nonePostWithDom();
      return;
    }

    var category = postMap[categoryName];

    filterPostsByContentPage(category, 2, categoryName, page);
  }

  // type: 1-content 2-category
  function filterPostsByContentPage(posts, type, content, page) {
    var tlen = posts.length;
    if (tlen == 0) {
      nonePostWithDom();
      return;
    }
    var tpage = parseInt(tlen / PAGE_SIZE) + (tlen % PAGE_SIZE == 0 ? 0 : 1);
    if (page > tpage) {
      page = tpage;
    }

    var start = (page - 1) * PAGE_SIZE;
    var end = page * PAGE_SIZE - 1;
    if (end > tlen - 1) {
      end = tlen -1;
    }

    var innerhtml = '<h3>News</h3><ul>';
    for(var idx = start; idx <= end; idx++){
      var post = posts[idx];
      var li = '<li>' + 
        '<a class="image-wrapper" href="' + post.url + '"><img src="/assets/images/placeholder.png" alt="News image"></a>' +
        '<h4><a class="cd-nowrap" href="' + post.url + '">' + post.title + '</a></h4>' +
        '<time datetime="">' + post.subtitle + '</time></li>';
      innerhtml += li;
    }
    innerhtml += '</ul><ul class="posts-nav">';

    //page
    if (page > 1) {
      var h = type + '#' + content + '#' + (page - 1);
      innerhtml += '<li class="previous"><a href="' + h + '" class="previous">后退</a></li>';
    }
    if (page < tpage) {
      var h = type + '#' + content + '#' + (page + 1);
      innerhtml += '<li class="next"><a href="' + h + '" class="next">更多...</a></li>';
    }
    innerhtml += '</ul>';

    postDom.html(innerhtml);
  }

});
