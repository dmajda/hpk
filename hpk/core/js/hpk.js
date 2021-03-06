/* HPK Namespace. */
var HPK = {};

/* ===== Utilities ===== */

jQuery.fn.boxify = function() {
  return this.each(function(index) {
    return jQuery(this)
      .addClass("box")
      .wrapInner("<div class='body' />")
      .prepend("<div class='header'>"
        + "<div class='header-left'>"
        + "<div class='header-right'>"
        + "<div class='header-inner'>"
        + "</div></div></div></div>"
      )
      .append("<div class='footer'>"
        + "<div class='footer-left'>"
        + "<div class='footer-right'>"
        + "<div class='footer-inner'>"
        + "</div></div></div></div>"
      );
  });
}

/* ===== GotoBox ===== */

/* Creates a new GotoBox object. */
HPK.GotoBox = function(presentation) {
  var that = this;
  this._element = $("<input type='text' id='goto-box'>")
    .keydown(function(event) {
      switch (event.which) {
        case 13: // Enter
          presentation.gotoSlide($(this).val() - 1);
          that.hide();
          return false;
        case 27: // ESC
          that.hide();
          return false;
        default:
          event.stopPropagation();
      }
    });
  $("body").append(this._element);
}

HPK.GotoBox.prototype = {
  /* Shows, clears and focuses the goto box. */
  show: function() {
    this._element.val("").show().focus();
  },

  /* Hides the goto box. */
  hide: function() {
    this._element.hide();
  }
}

/* ===== CurrentSlideCounter ===== */

/* Creates a new CurrentSlideCounter object. */
HPK.CurrentSlideCounter = function(slideCount) {
  this._slideCount = slideCount;
  this._element = $("<div id='current-slide-counter' />");
  $("body").append(this._element);
}

HPK.CurrentSlideCounter.prototype = {
  /* Updates the current slide counter and the location hash. */
  update: function(currentSlideIndex) {
    if (currentSlideIndex !== null) {
      this._element.text((currentSlideIndex + 1) + "/" + this._slideCount);
      location.hash = currentSlideIndex + 1;
    } else {
      /* Following statement is somewhat imperfect - it causes reload in Firefox
         and a trailing "#" character remians in the URL in IE and Chrome. But I
         don't think it's worth to investigate this more or work around the
         Firefox bug. At least until someone complains :-) */
      location.hash = "";
    }
  }
}

/* ===== SlideList ===== */

/* Creates a new SlideList object. */
HPK.SlideList = function(presentation, slides) {
  var that = this;

  var list = $("<ol />")
  slides.each(function(i) {
    list.append($("<li />").append($("<a href='#' />")
      .text($(this).find("h1").text())
      .click(function(event) {
        presentation.gotoSlide(i);
        that.hide();
        return false;
      })
    ));
  });

  this._focusTrap = $("<input type='text' class='focus-trap'>")
    .keydown(function(event) {
      if (event.which == 27) { // ESC
        that.hide();
        return false;
      } else {
        event.stopPropagation();
      }
    });
  this._element = $("<div id='slide-list' />")
    .append(list)
    .append($("<div id='close-slide-list-link' />").append($("<a href='#' />")
      .text(HPK.localizationStrings["closeSlideListLinkText"])
      .click(function(event) {
        that.hide();
        return false;
      })
    ))
    .append(this._focusTrap)
    .boxify();

  $("body").append(this._element);
}

HPK.SlideList.prototype = {
  /* Shows the slide list. */
  show: function() {
    this._element
      .find("ol")
        .css("maxHeight", $("body").outerHeight() * 0.5 + "px")
      .end()
      .css(
        "top",
        ($("body").outerHeight() - this._element.outerHeight()) / 2 + "px"
      )
      .css("opacity", "0")
      .show()
      .fadeTo("fast", 0.8);
    this._focusTrap.focus();
  },

  /* Hides the slide list. */
  hide: function() {
    this._element.fadeOut("fast");
  },

  /* Hides the slide list immediately (without the fade effect). */
  hideWithoutFade: function() {
    this._element.hide();
  }
}

/* ===== Navigation ===== */

/* Creates a new Navigation object. */
HPK.Navigation = function(presentation, slideList) {
  this._visible = false;
  this._pinned = false;
  var that = this;
  this._element = $("<div id='navigation' />")
    .append($("<a href='#' id='prev-slide-link' />")
      .attr("title", HPK.localizationStrings["prevSlideLinkTitle"])
      .click(function(event) {
        presentation.gotoPrevSlide();
        return false;
      })
    )
    .append($("<a href='#' id='slide-list-link' />")
      .attr("title", HPK.localizationStrings["slideListLinkTitle"])
      .click(function(event) {
        slideList.show();
        return false;
      })
    )
    .append($("<a href='#' id='next-slide-link' />")
      .attr("title", HPK.localizationStrings["nextSlideLinkTitle"])
      .click(function(event) {
        presentation.gotoNextSlide();
        return false;
      })
    )
    .mouseover(function() {
      that._clearHideTimer();
    })
    .mouseout(function() {
      that.touch();
    })
    .mousemove(function(event) {
      return false;
    })
    .boxify();
  $("body").append(this._element);
  this._hideTimer = null;
  this._unpinTimer = null;
}

HPK.Navigation.prototype = {
  /* Is the navigation visible? */
  isVisible: function() {
    return this._visible;
  },

  /* Is the navigation pinned? */
  isPinned: function() {
    return this._pinned;
  },

  /* Clears the current hiding timer. */
  _clearHideTimer: function() {
    if (this._hideTimer) {
      clearTimeout(this._hideTimer);
      this._hideTimer = null;
    }
  },

  /* Clears the current unpin timer. */
  _clearUnpinTimer: function() {
    if (this._unpinTimer) {
      clearTimeout(this._unpinTimer);
      this._unpinTimer = null;
    }
  },

  /* Clears the current hiding timer and creates a new one. */
  touch: function() {
    this._clearHideTimer();
    var that = this;
    this._hideTimer = setTimeout(function() {
      that.hide();
    }, 3000);
  },

  /* Marks the navigation as pinned for a while. */
  pin: function(ms) {
    this._pinned = true;
    var that = this;
    this._unpinTimer = setTimeout(function() {
      that._pinned = false;
    }, 3000);
  },

  /* Shows the navigation. */
  show: function() {
    this._visible = true;
    this._element.css("opacity", "0").show().fadeTo("normal", 0.8);
    this.touch();
  },

  /* Shows the navigation immediately (without the fade effect). */
  showWithoutFade: function() {
    this._visible = true;
    this._element.css("opacity", "0.8").show();
    this.touch();
  },

  /* Hides the navigation. */
  hide: function() {
    this._clearHideTimer();
    this._clearUnpinTimer();
    this._element.fadeOut("normal");
    this._visible = false;
    this._pinned = false;
  },

  /* Hides the navigation immediately (without the fade effect). */
  hideWithoutFade: function() {
    this._clearHideTimer();
    this._clearUnpinTimer();
    this._element.hide();
    this._visible = false;
    this._pinned = false;
  }
}

/* ===== Presentation ===== */

/* Creates a new Presentation object and injects the presentation mode toggle
   element into the HTML. */
HPK.Presentation = function() {
  this._slides = $("div.presentation div.slide");
  this._currentSlideIndex = null;
  this._presenting = false;
  this._screenStyleLinks = $("link[rel=stylesheet][media=screen]");
  this._projectionStyleLinks = $("link[rel=stylesheet][media=projection]");

  this._createRunPresentationLink();

  this._currentSlideCounter = new HPK.CurrentSlideCounter(this._slides.length);
  this._gotoBox = new HPK.GotoBox(this);
  this._slideList = new HPK.SlideList(this, this._slides);
  this._navigation = new HPK.Navigation(this, this._slideList);
}

HPK.Presentation.prototype = {
  /* Sets the base document font size. The size is specified in CSS format (as
     passed to the font-size rule). */
  _setBaseFontSize: function(size) {
    document.body.style.fontSize = size;
  },

  /* Creates the link that enables user to run the presentation. */
  _createRunPresentationLink: function() {
    var that = this;
    var link = $("<a href='#' />")
      .text(HPK.localizationStrings["runPresentationLinkText"])
      .click(function(event) {
        that.beginPresentation();

        /* The following line makes sure that the $(document.click(...) handler
           we setup in the "beginPresentation" will not catch the event. */
        return false;
      })
    $("body").append($("<div id='run-presentation-link' />").append(link).boxify());
  },

  /* Returns current slide as jQuery object. */
  _currentSlide: function() {
    return this._slides.slice(this._currentSlideIndex, this._currentSlideIndex + 1);
  },

  /* Are we presenting now? */
  isPresenting: function() {
    return this._presenting;
  },

  /* Begins the presentation. */
  beginPresentation: function() {
    if (this._presenting) { return; }
    if (this._slides.length == 0) { return; }

    this._setBaseFontSize(0.04 * $(window).height() + "px");
    this._slides.slice(1).hide();
    this._currentSlideIndex = 0;
    this._currentSlideCounter.update(this._currentSlideIndex);
    this._navigation.showWithoutFade();
    this._navigation.pin();

    this._screenStyleLinks.attr("media", "projection")
    this._projectionStyleLinks.attr("media", "screen");
    /* WebKit does not reflect all changes and needs a little help. */
    if ($.browser.safari) { // Detects Google Chrome too.
      this._screenStyleLinks.attr("disabled", "disabled");
      this._projectionStyleLinks.removeAttr("disabled");
    }

    var that = this;

    $(document).mousemove(function(event) {
      if (event.pageY >= 0.8 * $(document).height()) {
        if (!that._navigation.isVisible()) {
          that._navigation.show();
        } else {
          that._navigation.touch();
        }
      } else {
        if (that._navigation.isVisible() && !that._navigation.isPinned()) {
          that._navigation.hide();
        }
      }
    });

    $(document).click(function(event) {
      switch (event.button) {
        case 0: // Left button
          that.gotoNextSlide();
          return true;
        case 2: // Right button
          that.gotoPrevSlide();
          return true;
      }
    });

    $(document).keypress(function(event) {
      switch (event.which) {
        case 32:  // Space
        case 110: // "n"
          that.gotoNextSlide();
          return false;

        case 112: // "p"
          that.gotoPrevSlide();
          return false;

        case 103: // "g"
          that._gotoBox.show();
          return false;

        case 113: // "q"
          that.endPresentation();
          return false;
      }
    });

    $(document).keydown(function(event) {
      switch (event.which) {
        case 13: // Enter
        case 34: // Page Down
        case 39: // Right Arrow
        case 40: // Down Arrow
          that.gotoNextSlide();
          return false;

        case 8:  // Backspace
        case 33: // Page Up
        case 37: // Left Arrow
        case 38: // Up Arrow
          that.gotoPrevSlide();
          return false;

        case 27: // ESC
          that.endPresentation();
          return false;
      }
    });

    this._presenting = true;
  },

  /* Ends the presentation. */
  endPresentation: function() {
    if (!this._presenting) { return; }

    this._setBaseFontSize("100%");
    this._slides.show();
    this._currentSlideIndex = null;
    this._currentSlideCounter.update(this._currentSlideIndex);
    this._gotoBox.hide();
    this._slideList.hideWithoutFade();
    this._navigation.hideWithoutFade();

    this._screenStyleLinks.attr("media", "screen");
    this._projectionStyleLinks.attr("media", "projection");
    /* WebKit does not reflect all changes and needs a little help. */
    if ($.browser.safari) { // Detects Google Chrome too.
      this._screenStyleLinks.removeAttr("disabled");
      this._projectionStyleLinks.attr("disabled", "disabled");
    }

    $(document).unbind("mousemove");
    $(document).unbind("click");
    $(document).unbind("keypress");
    $(document).unbind("keydown");

    this._presenting = false;
  },

  /* Are we on the last slide? */
  isOnFirstSlide: function() {
    return this._presenting
      && this._currentSlideIndex == 0;
  },

  /* Are we on the last slide? */
  isOnLastSlide: function() {
    return this._presenting
      && this._currentSlideIndex == this._slides.length - 1;
  },

  /* If presenting, moves to the slide with specified index (if there is any). */
  gotoSlide: function(slideIndex) {
    if (this._presenting && slideIndex >= 0 && slideIndex < this._slides.length) {
      this._currentSlide().hide();
      this._currentSlideIndex = slideIndex;
      this._currentSlide().show();
      this._currentSlideCounter.update(this._currentSlideIndex);
    }
  },

  /* If presenting, moves to the next slide (if there is any). */
  gotoNextSlide: function() {
    this.gotoSlide(this._currentSlideIndex + 1);
  },

  /* If presenting, moves to the previous slide (if there is any). */
  gotoPrevSlide: function() {
    this.gotoSlide(this._currentSlideIndex - 1);
  }
}

/* ===== Let's roll... ===== */

$(document).ready(function() {
  /* Opera has its own presentation capabilities, we do not have to help it.
     See http://www.opera.com/browser/tutorials/operashow/. */
  if ($.browser.opera) { return; }

  HPK.presentation = new HPK.Presentation();

  /* These variables will be closed over by the resize handler bellow, so they
     will behave like static variables from its point of view. */
  var oldWindowWidth = $(window).width();
  var oldWindowHeight = $(window).height();

  $(window).bind("resize", function() {
    var windowWidth = $(window).width();
    var windowHeight = $(window).height();

    /* Optimization, the event is sometimes triggered unnecessairly by IE. */
    if (windowWidth == oldWindowWidth && windowHeight == oldWindowHeight) {
      return;
    }

    /* In IE, the window height is actually larger than the screen height
       in the fullscreen mode, but it does not count scrollbar width into the
       window width. As a result, fullscreen mode detection must be a bit
       tolerant. Firefox 3+ can detect fullscreen mode by itself. */
    var isFullscreen = $.browser.mozilla
      ? window.fullScreen
      : screen.width - windowWidth <= 20
        && screen.height - windowHeight <= 20;

    /* Automatically begin the presentation when the browser is switched to the
       full-screen mode. The presentation does not automatically end when
       switching out of the full-screen mode because it would be disturbing. */
    if (!HPK.presentation.isPresenting() && isFullscreen) {
      HPK.presentation.beginPresentation();
    }

    oldWindowWidth = windowWidth;
    oldWindowHeight = windowHeight;
  });

  var hash = document.location.hash;
  if (hash == "#presentation") {
    HPK.presentation.beginPresentation();
  }
  var matches = hash.match(/^#(\d+)$/);
  if (matches) {
    HPK.presentation.beginPresentation();
    HPK.presentation.gotoSlide(parseInt(matches[1]) - 1);
  }
});
