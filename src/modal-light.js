var utility = require('./utility.js');

/*!
 * modal-light 
 * v1.0.0
 * (https://github.com/gionatan-lombardi/modal-light)
 * Copyright (c) 2016 Gionatan Lombardi
 * Licensed under the MIT license
 */

(function(window) {

'use strict';
   
var buildObj = {

  handleEvent: function(e) {

    var self = this;

    // Prevents anchor default behaviour
    e.preventDefault();

    // Gets the href attribute
    var elHref = e.currentTarget.getAttribute('href');

    // Checks if the href is not a page anchor
    if ( elHref == "#" ) {
      console.log('ModalLight - 😔 sorry your link is not valid.');
      return false;
    } 

    // Creates the modal and a inner div for css styling
    self.modal = self.createElement('div', 'ModalLight-modal', document.body);
    var modalInner = self.createElement('div', 'ModalLight-inner', self.modal);
    // Creates modal closer button
    self.closer = self.createElement('button', 'ModalLight-closer', self.modal);
    self.closer.type = "button";
    self.closer.setAttribute('aria-label', 'Close modal');

    // Add a class to the modal for css transitions
    setTimeout( function () {
      utility.addClass(self.modal, 'is-visible')
    }, 0)

    // Adds the eventListener to the closer
    self.closer.addEventListener('click', function(e) {
      self.closeModal(e, self);
    });

    // Checks if it'a a Youtube video
    if ( self.isYoutubeVideo(elHref) ) {
      self.createYoutubeEmbed( modalInner, self.isYoutubeVideo(elHref) )
    }

  },

  /**
   * closeModal removes the modal from the DOM.
   * @param  {self.closer#event:click} event
   * @listens self.closer#event
   * @param {Object} self - the library this object.
   * @example
   * closeModal(event, this);
   * @url: https://developers.google.com/youtube/iframe_api_reference#Accessing_and_Modifying_DOM_Nodes
   */
  closeModal: function closeModal(e, self) {

    utility.removeClass(self.modal, 'is-visible');
    self.videoPlayer.stopVideo();
    self.videoPlayer.destroy();
    setTimeout( function () {
      var removedModal = document.body.removeChild(self.modal);
    }, 1000);

  },

  /**
   * createElement creates a DOM element and appends to a given parent node.
   * @param {string} tag - the tag name of the new element.
   * @param {string || false} className - the CSS class to add to the new element.
   * @param {DOM node} elToAppend - the parent element where to append the new element
   * @returns {DOM node} returns the created DOM node
   * @example
   * createElement("p", "myNewClass", document.body); // returns the <p> element
   */
  createElement: function createElement(tag, className, elToAppend) {

    var el = document.createElement(tag);
    if (className) utility.addClass(el, className)
    elToAppend.appendChild(el);
    return el;

  },

  /**
   * createYoutubeEmbed creates a youtube video player with the Youtube API.
   * @param {DOM node} el - the DOM node where to append the video frame.
   * @param {string} videoId - the youtube video id.
   * @returns {DOM node} returns the video player DOM node
   * @example
   * createYoutubeEmbed(document.body, "r4SsoTaOIKo"); // returns the videoContainer DOM node
   * @url: https://developers.google.com/youtube/iframe_api_reference
   */
  createYoutubeEmbed: function createYoutubeEmbed(el, videoId) {

    var self = this;

    // 1. This code creates the video container and the video div with a random id.
    var videoContainer = self.createElement('div', "ModalLight-videoContainer", el);
    var videoDiv = self.createElement('div', "ModalLight-videoDiv", videoContainer);
    videoDiv.id = "ModalLightVideoId" + (Math.ceil(Math.random()*100)) + (Math.ceil(Math.random()*100));

    // 2. This code loads the IFrame Player API code asynchronously if not present.
    var scriptPresent = false;
    var allScriptTag = document.getElementsByTagName('script');
    utility.forEachNodeList(allScriptTag, function(el, i) {
      if (el.src == "https://www.youtube.com/iframe_api") scriptPresent = true;
    })

    if (!scriptPresent) {
      var tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      var firstScriptTag = allScriptTag[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    // 3. This function creates an <iframe> (and YouTube player)
    //    after the API code downloads only on the first click (scriptPresent = true).
    var player;

    // Creates the <iframe>
    function setPlayer() {
      player = new YT.Player(videoDiv.id, {
        videoId: videoId,
        events: {
          'onReady': onPlayerReady
        }
      });
      self.videoPlayer = player;
    }

    // Waits on the creation only the first time
    // After the scripts has downloaded
    if (!scriptPresent) {
      window.onYouTubeIframeAPIReady = function() {
        setPlayer();
      }
    // After the first time recreates the <iframe> on the run
    } else {
      setPlayer();
    }

    // 4. The API will call this function when the video player is ready.
    window.onPlayerReady = function(event) {
      event.target.playVideo();
    }

    return videoContainer;
 
  },

  /**
   * isYoutubeVideo matches (and returns) the video Id 
   * of any valid Youtube Url, given as input string.
   * @param {string} url - any url string.
   * @returns {boolean} true if the url string is a youtube valid url
   * @example
   * isYoutubeVideo("https://www.youtube.com/watch?v=-hPes1uwnco"); // returns true
   * @author: Stephan Schmitz <eyecatchup@gmail.com>
   * @url: http://stackoverflow.com/a/10315969/624466
   */
  isYoutubeVideo: function isYoutubeVideo(url) {

    var p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
    return (url.match(p)) ? RegExp.$1 : false;

  },

  destroy: function destroy() {

    var self = this;
    // Event Listeners removing
    utility.forEachNodeList(self.triggers, function (el, i) {
      el.removeEventListener('click', self);
    });

  },

  // Init function
  init: function init(element) {

    var self = this;

    if (typeof element === 'undefined') {
      throw new Error('ModalLight - You must define a class selector!')
    }

    // The container string class
    self.triggerClass = element;

    // All the modal openers
    self.triggers = document.querySelectorAll('a'+ self.triggerClass);

    // If there are no openers silently exits the library
    if (!self.triggers.length) return;

    utility.forEachNodeList(self.triggers, function (el, i) {
      el.addEventListener('click', self);
    });

    // Public exposed methods
    return {
      destroy: this.destroy.bind(this)
    }
  },

};

// The Plugin Function (init)
function modalLight(element, cstOptions) {

  var defaultOptions = {
    modalClass: '.ModalLight-modal'
  }
  var options = utility.extend(defaultOptions, cstOptions);
  var o = Object.create(buildObj);
  o.options = options;

  return o.init(element);

};

// transport
if ( typeof define === 'function' && define.amd ) {
  // AMD
  define( modalLight );
} else if ( typeof exports === 'object' ) {
  // CommonJS
  module.exports = modalLight;
} else {
  // browser global
  window.modalLight = modalLight;
}

})( window );