/* HPK Namespace. */
var HPK = {};

/* ===== GotoBox ===== */

/* Creates a new GotoBox object. */
HPK.GotoBox = function(presentation) {
  var that = this;
  this._element = $("<input type='text' id='goto-box'>")
    .keypress(function(event) {
      switch (event.keyCode) {
        case 13: // Enter
          presentation.gotoSlide($(this).val() - 1);
          that.hide();
          break;
        case 27: // ESC
          that.hide();
          break;
      }
      event.stopPropagation();
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
HPK.CurrentSlideCounter = function() {
  this._element = $("<div id='current-slide-counter' />");
  $("body").append(this._element);
}

HPK.CurrentSlideCounter.prototype = {
  /* Updates the current slide counter. */
  update: function(currentSlideIndex) {
    this._element.text(currentSlideIndex + 1);
  }
}

/* ===== Navigation ===== */

/* Creates a new Navigation object. */
HPK.Navigation = function(presentation) {
  this._visible = false;
  var that = this;
  this._element = $("<div id='navigation' />")
    .append($("<a href='#' id='prev-slide-link' />")
      .click(function(event) {
        presentation.gotoPrevSlide();
        event.stopPropagation();
      })
    )
    .append($("<a href='#' id='slide-list-link' />")
      .click(function(event) {
        alert("TODO")
      })
    )
    .append($("<a href='#' id='next-slide-link' />")
      .click(function(event) {
        presentation.gotoNextSlide();
        event.stopPropagation();
      })
    )
    .mouseover(function() {
      that.clearHideTimer();
    })
    .mouseout(function() {
      that.touch();
    })
    .mousemove(function(event) {
      event.stopPropagation();
    });
  $("body").append(this._element);
  this._hideTimer = null;
}

HPK.Navigation.prototype = {
  /* Is the navigation visible? */
  isVisible: function() {
    return this._visible;
  },

  /* Clears the current hiding timer. */
  clearHideTimer: function() {
    if (this._hideTimer) {
      clearTimeout(this._hideTimer);
      this._hideTimer = null;
    }
  },

  /* Clears the current hiding timer and creates a new one. */
  touch: function() {
    this.clearHideTimer();
    var that = this;
    this._hideTimer = setTimeout(function() {
      that.hide();
    }, 5000);
  },

  /* Shows the navigation. */
  show: function() {
    this._visible = true;
    this._element.css("opacity", "0").show().fadeTo("normal", 0.8);
    this.touch();
  },

  /* Hides the navigation. */
  hide: function() {
    this.clearHideTimer();
    this._element.fadeOut("normal");
    this._visible = false;
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

  this._currentSlideCounter = new HPK.CurrentSlideCounter;
  this._gotoBox = new HPK.GotoBox(this);
  this._navigation = new HPK.Navigation();
}

HPK.Presentation.prototype = {
  /* Creates the link that enables user to run the presentation. */
  _createRunPresentationLink: function() {
    var that = this;
    $("body").append($("<a href='#' id='run-presentation-link' />")
      .text(HPK.localizationStrings["runPresentation"])
      .click(function(event) {
        that.beginPresentation();

        /* The following line makes sure that the $(document.click(...) handler
           we setup in the "beginPresentation" will not catch the event. */
        event.stopPropagation();
      })
    );
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

    this._slides.slice(1).hide();
    this._currentSlideIndex = 0;
    this._currentSlideCounter.update(this._currentSlideIndex);

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
        if (that._navigation.isVisible()) {
          that._navigation.hide();
        }
      }
    });

    $(document).click(function(event) {
      switch (event.which) {
        case 1: // Left button
          that.gotoNextSlideOrEndPresentation();
          return false;
        case 3: // Right button
          that.gotoPrevSlideOrEndPresentation();
          return false;
      }
    });

    $(document).keypress(function(event) {
      switch (event.which) {
        case 13:  // Enter
        case 32:  // Space
        case 110: // "n"
          that.gotoNextSlideOrEndPresentation();
          return false;

        case 8:   // Backspace
        case 112: // "p"
          that.gotoPrevSlideOrEndPresentation();
          return false;

        case 103: // "g"
          that._gotoBox.show();
          return false;

        case 0:
          switch (event.keyCode) {
            case 34: // Page Down
            case 39: // Right Arrow
            case 40: // Down Arrow
              that.gotoNextSlideOrEndPresentation();
              return false;

            case 33: // Page Up
            case 37: // Left Arrow
            case 38: // Up Arrow
              that.gotoPrevSlideOrEndPresentation();
              return false;

            case 27: // ESC
              that.endPresentation();
              return false;
          }
      }
    });

    this._presenting = true;
  },

  /* Ends the presentation. */
  endPresentation: function() {
    if (!this._presenting) { return; }

    this._slides.show();
    this._currentSlideIndex = null;
    this._gotoBox.hide();

    this._screenStyleLinks.attr("media", "screen");
    this._projectionStyleLinks.attr("media", "projection");
    /* WebKit does not reflect all changes and needs a little help. */
    if ($.browser.safari) { // Detects Google Chrome too.
      this._screenStyleLinks.removeAttr("disabled");
      this._projectionStyleLinks.attr("disabled", "disabled");
    }

    $(document).unbind("mousemove", this._documentMousemove);
    $(document).unbind("click", this._documentClick);
    $(document).unbind("keypress", this._documentKeypress);

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
  },

  /* If presenting, moves to the next slide (if there is any) or ends the
     presentation. */
  gotoNextSlideOrEndPresentation: function() {
    if (this._presenting) {
      if (!this.isOnLastSlide()) {
        this.gotoNextSlide();
      } else {
        this.endPresentation();
      }
    }
  },

  /* If presenting, moves to the previous slide (if there is any) or ends the
     presentation. */
  gotoPrevSlideOrEndPresentation: function() {
    if (this._presenting) {
      if (!this.isOnFirstSlide()) {
        this.gotoPrevSlide();
      } else {
        this.endPresentation();
      }
    }
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

    /* This is obviously an optimization, but we do it mainly because IE
       triggers the resize handler much more often than it should, which
       results to switching from and to the presentation again in certain
       situations (such as clicking the "Run presentation" link or at the
       end of the presentation). */
    if (windowWidth == oldWindowWidth && windowHeight == oldWindowHeight) {
      return;
    }

    /* In IE, the window height is actually larger than the screen height
       in the fullscreen mode, but it does not count scrollbar width into
       the window width. Firefox has a small bar at the top even in the
       fullscreen mode. As a result, fullscreen mode detection must be a bit
       tolerant. Browser world is a mess... */
    var isFullscreen = screen.width - windowWidth <= 20
      && screen.height - windowHeight <= 10;

    if (!HPK.presentation.isPresenting() && isFullscreen) {
      HPK.presentation.beginPresentation();
    } else if (HPK.presentation.isPresenting() && !isFullscreen) {
      HPK.presentation.endPresentation();
    }

    oldWindowWidth = windowWidth;
    oldWindowHeight = windowHeight;
  });

  var matches = document.location.hash.match(/^#slide-(\d+)$/);
  if (matches) {
    HPK.presentation.beginPresentation();
    HPK.presentation.gotoSlide(parseInt(matches[1]) - 1);
  }
});
