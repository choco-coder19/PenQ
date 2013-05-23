/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is FUEL.
 *
 * The Initial Developer of the Original Code is Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2006
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *  Mark Finkle <mfinkle@mozilla.com> (Original Author)
 *  John Resig  <jresig@mozilla.com> (Original Author)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

const Ci = Components.interfaces;
const Cc = Components.classes;

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

const APPLICATION_CID = Components.ID("fe74cf80-aa2d-11db-abbd-0800200c9a66");
const APPLICATION_CONTRACTID = "@mozilla.org/fuel/application;1";

//=================================================
// Singleton that holds services and utilities
var Utilities = {
  get bookmarks() {
    let bookmarks = Cc["@mozilla.org/browser/nav-bookmarks-service;1"].
                    getService(Ci.nsINavBookmarksService);
    this.__defineGetter__("bookmarks", function() bookmarks);
    return this.bookmarks;
  },

  get livemarks() {
    let livemarks = Cc["@mozilla.org/browser/livemark-service;2"].
                    getService(Ci.nsILivemarkService);
    this.__defineGetter__("livemarks", function() livemarks);
    return this.livemarks;
  },

  get annotations() {
    let annotations = Cc["@mozilla.org/browser/annotation-service;1"].
                      getService(Ci.nsIAnnotationService);
    this.__defineGetter__("annotations", function() annotations);
    return this.annotations;
  },

  get history() {
    let history = Cc["@mozilla.org/browser/nav-history-service;1"].
                  getService(Ci.nsINavHistoryService);
    this.__defineGetter__("history", function() history);
    return this.history;
  },

  get windowMediator() {
    let windowMediator = Cc["@mozilla.org/appshell/window-mediator;1"].
                         getService(Ci.nsIWindowMediator);
    this.__defineGetter__("windowMediator", function() windowMediator);
    return this.windowMediator;
  },

  makeURI : function(aSpec) {
    if (!aSpec)
      return null;
    var ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
    return ios.newURI(aSpec, null, null);
  },

  free : function() {
    delete this.bookmarks;
    delete this.livemarks
    delete this.annotations;
    delete this.history;
    delete this.windowMediator;
  }
};


//=================================================
// Window implementation
function Window(aWindow) {
  this._window = aWindow;
  this._tabbrowser = aWindow.getBrowser();
  this._events = new Events();
  this._cleanup = {};

  this._watch("TabOpen");
  this._watch("TabMove");
  this._watch("TabClose");
  this._watch("TabSelect");

  var self = this;
  gShutdown.push(function() { self._shutdown(); });
}

Window.prototype = {
  get events() {
    return this._events;
  },

  /*
   * Helper used to setup event handlers on the XBL element. Note that the events
   * are actually dispatched to tabs, so we capture them.
   */
  _watch : function win_watch(aType) {
    var self = this;
    this._tabbrowser.tabContainer.addEventListener(aType,
      this._cleanup[aType] = function(e){ self._event(e); },
      true);
  },

  /*
   * Helper event callback used to redirect events made on the XBL element
   */
  _event : function win_event(aEvent) {
    this._events.dispatch(aEvent.type, new BrowserTab(this, aEvent.originalTarget.linkedBrowser));
  },
  get tabs() {
    var tabs = [];
    var browsers = this._tabbrowser.browsers;
    for (var i=0; i<browsers.length; i++)
      tabs.push(new BrowserTab(this, browsers[i]));
    return tabs;
  },
  get activeTab() {
    return new BrowserTab(this, this._tabbrowser.selectedBrowser);
  },
  open : function win_open(aURI) {
    return new BrowserTab(this, this._tabbrowser.addTab(aURI.spec).linkedBrowser);
  },
  _shutdown : function win_shutdown() {
    for (var type in this._cleanup)
      this._tabbrowser.removeEventListener(type, this._cleanup[type], true);
    this._cleanup = null;

    this._window = null;
    this._tabbrowser = null;
    this._events = null;
  },

  QueryInterface : XPCOMUtils.generateQI([Ci.fuelIWindow])
};

//=================================================
// BrowserTab implementation
function BrowserTab(aFUELWindow, aBrowser) {
  this._window = aFUELWindow;
  this._tabbrowser = aFUELWindow._tabbrowser;
  this._browser = aBrowser;
  this._events = new Events();
  this._cleanup = {};

  this._watch("load");

  var self = this;
  gShutdown.push(function() { self._shutdown(); });
}

BrowserTab.prototype = {
  get uri() {
    return this._browser.currentURI;
  },

  get index() {
    var tabs = this._tabbrowser.tabs;
    for (var i=0; i<tabs.length; i++) {
      if (tabs[i].linkedBrowser == this._browser)
        return i;
    }
    return -1;
  },

  get events() {
    return this._events;
  },

  get window() {
    return this._window;
  },

  get document() {
    return this._browser.contentDocument;
  },

  /*
   * Helper used to setup event handlers on the XBL element
   */
  _watch : function bt_watch(aType) {
    var self = this;
    this._browser.addEventListener(aType,
      this._cleanup[aType] = function(e){ self._event(e); },
      true);
  },

  /*
   * Helper event callback used to redirect events made on the XBL element
   */
  _event : function bt_event(aEvent) {
    if (aEvent.type == "load") {
      if (!(aEvent.originalTarget instanceof Ci.nsIDOMDocument))
        return;

      if (aEvent.originalTarget.defaultView instanceof Ci.nsIDOMWindow &&
          aEvent.originalTarget.defaultView.frameElement)
        return;
    }
    this._events.dispatch(aEvent.type, this);
  },
  /*
   * Helper used to determine the index offset of the browsertab
   */
  _getTab : function bt_gettab() {
    var tabs = this._tabbrowser.tabs;
    return tabs[this.index] || null;
  },

  load : function bt_load(aURI) {
    this._browser.loadURI(aURI.spec, null, null);
  },

  focus : function bt_focus() {
    this._tabbrowser.selectedTab = this._getTab();
    this._tabbrowser.focus();
  },

  close : function bt_close() {
    this._tabbrowser.removeTab(this._getTab());
  },

  moveBefore : function bt_movebefore(aBefore) {
    this._tabbrowser.moveTabTo(this._getTab(), aBefore.index);
  },

  moveToEnd : function bt_moveend() {
    this._tabbrowser.moveTabTo(this._getTab(), this._tabbrowser.browsers.length);
  },

  _shutdown : function bt_shutdown() {
    for (var type in this._cleanup)
      this._browser.removeEventListener(type, this._cleanup[type], true);
    this._cleanup = null;

    this._window = null;
    this._tabbrowser = null;
    this._browser = null;
    this._events = null;
  },

  QueryInterface : XPCOMUtils.generateQI([Ci.fuelIBrowserTab])
};


//=================================================
// Annotations implementation
function Annotations(aId) {
  this._id = aId;
}

Annotations.prototype = {
  get names() {
    return Utilities.annotations.getItemAnnotationNames(this._id);
  },

  has : function ann_has(aName) {
    return Utilities.annotations.itemHasAnnotation(this._id, aName);
  },

  get : function(aName) {
    if (this.has(aName))
      return Utilities.annotations.getItemAnnotation(this._id, aName);
    return null;
  },

  set : function(aName, aValue, aExpiration) {
    Utilities.annotations.setItemAnnotation(this._id, aName, aValue, 0, aExpiration);
  },

  remove : function ann_remove(aName) {
    if (aName)
      Utilities.annotations.removeItemAnnotation(this._id, aName);
  },

  QueryInterface : XPCOMUtils.generateQI([Ci.fuelIAnnotations])
};


//=================================================
// Bookmark implementation
function Bookmark(aId, aParent, aType) {
  this._id = aId;
  this._parent = aParent;
  this._type = aType || "bookmark";
  this._annotations = new Annotations(this._id);
  this._events = new Events();

  Utilities.bookmarks.addObserver(this, false);

  var self = this;
  gShutdown.push(function() { self._shutdown(); });
}

Bookmark.prototype = {
  _shutdown : function bm_shutdown() {
    this._annotations = null;
    this._events = null;

    Utilities.bookmarks.removeObserver(this);
  },

  get id() {
    return this._id;
  },

  get title() {
    return Utilities.bookmarks.getItemTitle(this._id);
  },

  set title(aTitle) {
    Utilities.bookmarks.setItemTitle(this._id, aTitle);
  },

  get uri() {
    return Utilities.bookmarks.getBookmarkURI(this._id);
  },

  set uri(aURI) {
    return Utilities.bookmarks.changeBookmarkURI(this._id, aURI);
  },

  get description() {
    return this._annotations.get("bookmarkProperties/description");
  },

  set description(aDesc) {
    this._annotations.set("bookmarkProperties/description", aDesc, Ci.nsIAnnotationService.EXPIRE_NEVER);
  },

  get keyword() {
    return Utilities.bookmarks.getKeywordForBookmark(this._id);
  },

  set keyword(aKeyword) {
    Utilities.bookmarks.setKeywordForBookmark(this._id, aKeyword);
  },

  get type() {
    return this._type;
  },

  get parent() {
    return this._parent;
  },

  set parent(aFolder) {
    Utilities.bookmarks.moveItem(this._id, aFolder.id, Utilities.bookmarks.DEFAULT_INDEX);
    // this._parent is updated in onItemMoved
  },

  get annotations() {
    return this._annotations;
  },

  get events() {
    return this._events;
  },

  remove : function bm_remove() {
    Utilities.bookmarks.removeItem(this._id);
  },

  // observer
  onBeginUpdateBatch : function bm_obub() {
  },

  onEndUpdateBatch : function bm_oeub() {
  },

  onItemAdded : function bm_oia(aId, aFolder, aIndex, aItemType, aURI) {
    // bookmark object doesn't exist at this point
  },

  onBeforeItemRemoved : function bm_obir(aId) {
  },

  onItemRemoved : function bm_oir(aId, aFolder, aIndex) {
    if (this._id == aId)
      this._events.dispatch("remove", aId);
  },

  onItemChanged : function bm_oic(aId, aProperty, aIsAnnotationProperty, aValue) {
    if (this._id == aId)
      this._events.dispatch("change", aProperty);
  },

  onItemVisited: function bm_oiv(aId, aVisitID, aTime) {
  },

  onItemMoved: function bm_oim(aId, aOldParent, aOldIndex, aNewParent, aNewIndex) {
    if (this._id == aId) {
      this._parent = new BookmarkFolder(aNewParent, Utilities.bookmarks.getFolderIdForItem(aNewParent));
      this._events.dispatch("move", aId);
    }
  },

  QueryInterface : XPCOMUtils.generateQI([Ci.fuelIBookmark, Ci.nsINavBookmarkObserver])
};


//=================================================
// BookmarkFolder implementation
function BookmarkFolder(aId, aParent) {
  this._id = aId;
  this._parent = aParent;
  this._annotations = new Annotations(this._id);
  this._events = new Events();

  Utilities.bookmarks.addObserver(this, false);

  var self = this;
  gShutdown.push(function() { self._shutdown(); });
}

BookmarkFolder.prototype = {
  _shutdown : function bmf_shutdown() {
    this._annotations = null;
    this._events = null;

    Utilities.bookmarks.removeObserver(this);
  },

  get id() {
    return this._id;
  },

  get title() {
    return Utilities.bookmarks.getItemTitle(this._id);
  },

  set title(aTitle) {
    Utilities.bookmarks.setItemTitle(this._id, aTitle);
  },

  get description() {
    return this._annotations.get("bookmarkProperties/description");
  },

  set description(aDesc) {
    this._annotations.set("bookmarkProperties/description", aDesc, Ci.nsIAnnotationService.EXPIRE_NEVER);
  },

  get type() {
    return "folder";
  },

  get parent() {
    return this._parent;
  },

  set parent(aFolder) {
    Utilities.bookmarks.moveItem(this._id, aFolder.id, Utilities.bookmarks.DEFAULT_INDEX);
    // this._parent is updated in onItemMoved
  },

  get annotations() {
    return this._annotations;
  },

  get events() {
    return this._events;
  },

  get children() {
    var items = [];

    var options = Utilities.history.getNewQueryOptions();
    var query = Utilities.history.getNewQuery();
    query.setFolders([this._id], 1);
    var result = Utilities.history.executeQuery(query, options);
    var rootNode = result.root;
    rootNode.containerOpen = true;
    var cc = rootNode.childCount;
    for (var i=0; i<cc; ++i) {
      var node = rootNode.getChild(i);
      if (node.type == node.RESULT_TYPE_FOLDER) {
        var folder = new BookmarkFolder(node.itemId, this._id);
        items.push(folder);
      }
      else if (node.type == node.RESULT_TYPE_SEPARATOR) {
        var separator = new Bookmark(node.itemId, this._id, "separator");
        items.push(separator);
      }
      else {
        var bookmark = new Bookmark(node.itemId, this._id, "bookmark");
        items.push(bookmark);
      }
    }
    rootNode.containerOpen = false;

    return items;
  },

  addBookmark : function bmf_addbm(aTitle, aUri) {
    var newBookmarkID = Utilities.bookmarks.insertBookmark(this._id, aUri, Utilities.bookmarks.DEFAULT_INDEX, aTitle);
    var newBookmark = new Bookmark(newBookmarkID, this, "bookmark");
    return newBookmark;
  },

  addSeparator : function bmf_addsep() {
    var newBookmarkID = Utilities.bookmarks.insertSeparator(this._id, Utilities.bookmarks.DEFAULT_INDEX);
    var newBookmark = new Bookmark(newBookmarkID, this, "separator");
    return newBookmark;
  },

  addFolder : function bmf_addfolder(aTitle) {
    var newFolderID = Utilities.bookmarks.createFolder(this._id, aTitle, Utilities.bookmarks.DEFAULT_INDEX);
    var newFolder = new BookmarkFolder(newFolderID, this);
    return newFolder;
  },

  remove : function bmf_remove() {
    Utilities.bookmarks.removeItem(this._id);
  },

  // observer
  onBeginUpdateBatch : function bmf_obub() {
  },

  onEndUpdateBatch : function bmf_oeub() {
  },

  onItemAdded : function bmf_oia(aId, aFolder, aIndex, aItemType, aURI) {
    // handle root folder events
    if (!this._parent)
      this._events.dispatch("add", aId);

    // handle this folder events
    if (this._id == aFolder)
      this._events.dispatch("addchild", aId);
  },

  onBeforeItemRemoved : function bmf_oir(aId) {
  },

  onItemRemoved : function bmf_oir(aId, aFolder, aIndex) {
    // handle root folder events
    if (!this._parent || this._id == aId)
      this._events.dispatch("remove", aId);

    // handle this folder events
    if (this._id == aFolder)
      this._events.dispatch("removechild", aId);
  },

  onItemChanged : function bmf_oic(aId, aProperty, aIsAnnotationProperty, aValue) {
    // handle root folder and this folder events
    if (!this._parent || this._id == aId)
      this._events.dispatch("change", aProperty);
  },

  onItemVisited: function bmf_oiv(aId, aVisitID, aTime) {
  },

  onItemMoved: function bmf_oim(aId, aOldParent, aOldIndex, aNewParent, aNewIndex) {
    // handle this folder event, root folder cannot be moved
    if (this._id == aId) {
      this._parent = new BookmarkFolder(aNewParent, Utilities.bookmarks.getFolderIdForItem(aNewParent));
      this._events.dispatch("move", aId);
    }
  },

  QueryInterface : XPCOMUtils.generateQI([Ci.fuelIBookmarkFolder, Ci.nsINavBookmarkObserver])
};

//=================================================
// BookmarkRoots implementation
function BookmarkRoots() {
  var self = this;
  gShutdown.push(function() { self._shutdown(); });
}

BookmarkRoots.prototype = {
  _shutdown : function bmr_shutdown() {
    this._menu = null;
    this._toolbar = null;
    this._tags = null;
    this._unfiled = null;
  },

  get menu() {
    if (!this._menu)
      this._menu = new BookmarkFolder(Utilities.bookmarks.bookmarksMenuFolder, null);

    return this._menu;
  },

  get toolbar() {
    if (!this._toolbar)
      this._toolbar = new BookmarkFolder(Utilities.bookmarks.toolbarFolder, null);

    return this._toolbar;
  },

  get tags() {
    if (!this._tags)
      this._tags = new BookmarkFolder(Utilities.bookmarks.tagsFolder, null);

    return this._tags;
  },

  get unfiled() {
    if (!this._unfiled)
      this._unfiled = new BookmarkFolder(Utilities.bookmarks.unfiledBookmarksFolder, null);

    return this._unfiled;
  },

  QueryInterface : XPCOMUtils.generateQI([Ci.fuelIBookmarkRoots])
};


//=================================================
// Factory - Treat Application as a singleton
// XXX This is required, because we're registered for the 'JavaScript global
// privileged property' category, whose handler always calls createInstance.
// See bug 386535.
var gSingleton = null;
var ApplicationFactory = {
  createInstance: function af_ci(aOuter, aIID) {
    if (aOuter != null)
      throw Components.results.NS_ERROR_NO_AGGREGATION;

    if (gSingleton == null) {
      gSingleton = new Application();
    }

    return gSingleton.QueryInterface(aIID);
  }
};


//=================================================
// Application constructor
function Application() {
  this.initToolkitHelpers();
  this._bookmarks = null;
}

//=================================================
// Application implementation
Application.prototype = {
  // for nsIClassInfo + XPCOMUtils
  classID:          APPLICATION_CID,

  // redefine the default factory for XPCOMUtils
  _xpcom_factory: ApplicationFactory,

  // for nsISupports
  QueryInterface : XPCOMUtils.generateQI([Ci.fuelIApplication, Ci.extIApplication,
                                          Ci.nsIObserver]),

  // for nsIClassInfo
  classInfo: XPCOMUtils.generateCI({classID: APPLICATION_CID,
                                    contractID: APPLICATION_CONTRACTID,
                                    interfaces: [Ci.fuelIApplication,
                                                 Ci.extIApplication,
                                                 Ci.nsIObserver],
                                    flags: Ci.nsIClassInfo.SINGLETON}),

  // for nsIObserver
  observe: function app_observe(aSubject, aTopic, aData) {
    // Call the extApplication version of this function first
    this.__proto__.__proto__.observe.call(this, aSubject, aTopic, aData);
    if (aTopic == "xpcom-shutdown") {
      this._obs.removeObserver(this, "xpcom-shutdown");
      this._bookmarks = null;
      Utilities.free();
    }
  },

  get bookmarks() {
    let bookmarks = new BookmarkRoots();
    this.__defineGetter__("bookmarks", function() bookmarks);
    return this.bookmarks;
  },

  get windows() {
    var win = [];
    var browserEnum = Utilities.windowMediator.getEnumerator("navigator:browser");

    while (browserEnum.hasMoreElements())
      win.push(new Window(browserEnum.getNext()));

    return win;
  },

  get activeWindow() {
    return new Window(Utilities.windowMediator.getMostRecentWindow("navigator:browser"));
  }
};

/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is FUEL.
 *
 * The Initial Developer of the Original Code is Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2006
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *  Mark Finkle <mfinkle@mozilla.com> (Original Author)
 *  John Resig  <jresig@mozilla.com> (Original Author)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Components.utils.import("resource://gre/modules/AddonManager.jsm");

//=================================================
// Shutdown - used to store cleanup functions which will
//            be called on Application shutdown
var gShutdown = [];

//=================================================
// Console constructor
function Console() {
  this._console = Components.classes["@mozilla.org/consoleservice;1"]
    .getService(Ci.nsIConsoleService);
}

//=================================================
// Console implementation
Console.prototype = {
  log : function cs_log(aMsg) {
    this._console.logStringMessage(aMsg);
  },

  open : function cs_open() {
    var wMediator = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                              .getService(Ci.nsIWindowMediator);
    var console = wMediator.getMostRecentWindow("global:console");
    if (!console) {
      var wWatch = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                             .getService(Ci.nsIWindowWatcher);
      wWatch.openWindow(null, "chrome://global/content/console.xul", "_blank",
                        "chrome,dialog=no,all", null);
    } else {
      // console was already open
      console.focus();
    }
  },

  QueryInterface : XPCOMUtils.generateQI([Ci.extIConsole])
};


//=================================================
// EventItem constructor
function EventItem(aType, aData) {
  this._type = aType;
  this._data = aData;
}

//=================================================
// EventItem implementation
EventItem.prototype = {
  _cancel : false,

  get type() {
    return this._type;
  },

  get data() {
    return this._data;
  },

  preventDefault : function ei_pd() {
    this._cancel = true;
  },

  QueryInterface : XPCOMUtils.generateQI([Ci.extIEventItem])
};


//=================================================
// Events constructor
function Events(notifier) {
  this._listeners = [];
  this._notifier = notifier;
}

//=================================================
// Events implementation
Events.prototype = {
  addListener : function evts_al(aEvent, aListener) {
    function hasFilter(element) {
      return element.event == aEvent && element.listener == aListener;
    }

    if (this._listeners.some(hasFilter))
      return;

    this._listeners.push({
      event: aEvent,
      listener: aListener
    });

    if (this._notifier) {
      this._notifier(aEvent, aListener);
    }
  },

  removeListener : function evts_rl(aEvent, aListener) {
    function hasFilter(element) {
      return (element.event != aEvent) || (element.listener != aListener);
    }

    this._listeners = this._listeners.filter(hasFilter);
  },

  dispatch : function evts_dispatch(aEvent, aEventItem) {
    var eventItem = new EventItem(aEvent, aEventItem);

    this._listeners.forEach(function(key){
      if (key.event == aEvent) {
        key.listener.handleEvent ?
          key.listener.handleEvent(eventItem) :
          key.listener(eventItem);
      }
    });

    return !eventItem._cancel;
  },

  QueryInterface : XPCOMUtils.generateQI([Ci.extIEvents])
};


//=================================================
// PreferenceBranch constructor
function PreferenceBranch(aBranch) {
  if (!aBranch)
    aBranch = "";

  this._root = aBranch;
  this._prefs = Components.classes["@mozilla.org/preferences-service;1"]
                          .getService(Ci.nsIPrefService);

  if (aBranch)
    this._prefs = this._prefs.getBranch(aBranch);

  this._prefs.QueryInterface(Ci.nsIPrefBranch);
  this._prefs.QueryInterface(Ci.nsIPrefBranch2);

  // we want to listen to "all" changes for this branch, so pass in a blank domain
  this._prefs.addObserver("", this, true);
  this._events = new Events();

  var self = this;
  gShutdown.push(function() { self._shutdown(); });
}

//=================================================
// PreferenceBranch implementation
PreferenceBranch.prototype = {
  // cleanup observer so we don't leak
  _shutdown: function prefs_shutdown() {
    this._prefs.removeObserver(this._root, this);

    this._prefs = null;
    this._events = null;
  },

  // for nsIObserver
  observe: function prefs_observe(aSubject, aTopic, aData) {
    if (aTopic == "nsPref:changed")
      this._events.dispatch("change", aData);
  },

  get root() {
    return this._root;
  },

  get all() {
    return this.find({});
  },

  get events() {
    return this._events;
  },

  // XXX: Disabled until we can figure out the wrapped object issues
  // name: "name" or /name/
  // path: "foo.bar." or "" or /fo+\.bar/
  // type: Boolean, Number, String (getPrefType)
  // locked: true, false (prefIsLocked)
  // modified: true, false (prefHasUserValue)
  find : function prefs_find(aOptions) {
    var retVal = [];
    var items = this._prefs.getChildList("");

    for (var i = 0; i < items.length; i++) {
      retVal.push(new Preference(items[i], this));
    }

    return retVal;
  },

  has : function prefs_has(aName) {
    return (this._prefs.getPrefType(aName) != Ci.nsIPrefBranch.PREF_INVALID);
  },

  get : function prefs_get(aName) {
    return this.has(aName) ? new Preference(aName, this) : null;
  },

  getValue : function prefs_gv(aName, aValue) {
    var type = this._prefs.getPrefType(aName);

    switch (type) {
      case Ci.nsIPrefBranch2.PREF_STRING:
        aValue = this._prefs.getComplexValue(aName, Ci.nsISupportsString).data;
        break;
      case Ci.nsIPrefBranch2.PREF_BOOL:
        aValue = this._prefs.getBoolPref(aName);
        break;
      case Ci.nsIPrefBranch2.PREF_INT:
        aValue = this._prefs.getIntPref(aName);
        break;
    }

    return aValue;
  },

  setValue : function prefs_sv(aName, aValue) {
    var type = aValue != null ? aValue.constructor.name : "";

    switch (type) {
      case "String":
        var str = Components.classes["@mozilla.org/supports-string;1"]
                            .createInstance(Ci.nsISupportsString);
        str.data = aValue;
        this._prefs.setComplexValue(aName, Ci.nsISupportsString, str);
        break;
      case "Boolean":
        this._prefs.setBoolPref(aName, aValue);
        break;
      case "Number":
        this._prefs.setIntPref(aName, aValue);
        break;
      default:
        throw("Unknown preference value specified.");
    }
  },

  reset : function prefs_reset() {
    this._prefs.resetBranch("");
  },

  QueryInterface : XPCOMUtils.generateQI([Ci.extIPreferenceBranch, Ci.nsISupportsWeakReference])
};


//=================================================
// Preference constructor
function Preference(aName, aBranch) {
  this._name = aName;
  this._branch = aBranch;
  this._events = new Events();

  var self = this;

  this.branch.events.addListener("change", function(aEvent){
    if (aEvent.data == self.name)
      self.events.dispatch(aEvent.type, aEvent.data);
  });
}

//=================================================
// Preference implementation
Preference.prototype = {
  get name() {
    return this._name;
  },

  get type() {
    var value = "";
    var type = this.branch._prefs.getPrefType(this._name);

    switch (type) {
      case Ci.nsIPrefBranch2.PREF_STRING:
        value = "String";
        break;
      case Ci.nsIPrefBranch2.PREF_BOOL:
        value = "Boolean";
        break;
      case Ci.nsIPrefBranch2.PREF_INT:
        value = "Number";
        break;
    }

    return value;
  },

  get value() {
    return this.branch.getValue(this._name, null);
  },

  set value(aValue) {
    return this.branch.setValue(this._name, aValue);
  },

  get locked() {
    return this.branch._prefs.prefIsLocked(this.name);
  },

  set locked(aValue) {
    this.branch._prefs[ aValue ? "lockPref" : "unlockPref" ](this.name);
  },

  get modified() {
    return this.branch._prefs.prefHasUserValue(this.name);
  },

  get branch() {
    return this._branch;
  },

  get events() {
    return this._events;
  },

  reset : function pref_reset() {
    this.branch._prefs.clearUserPref(this.name);
  },

  QueryInterface : XPCOMUtils.generateQI([Ci.extIPreference])
};


//=================================================
// SessionStorage constructor
function SessionStorage() {
  this._storage = {};
  this._events = new Events();
}

//=================================================
// SessionStorage implementation
SessionStorage.prototype = {
  get events() {
    return this._events;
  },

  has : function ss_has(aName) {
    return this._storage.hasOwnProperty(aName);
  },

  set : function ss_set(aName, aValue) {
    this._storage[aName] = aValue;
    this._events.dispatch("change", aName);
  },

  get : function ss_get(aName, aDefaultValue) {
    return this.has(aName) ? this._storage[aName] : aDefaultValue;
  },

  QueryInterface : XPCOMUtils.generateQI([Ci.extISessionStorage])
};


//=================================================
// Extension constructor
function Extension(aItem) {
  this._item = aItem;
  this._firstRun = false;
  this._prefs = new PreferenceBranch("extensions." + this.id + ".");
  this._storage = new SessionStorage();
  this._events = new Events();

  var installPref = "install-event-fired";
  if (!this._prefs.has(installPref)) {
    this._prefs.setValue(installPref, true);
    this._firstRun = true;
  }

  AddonManager.addAddonListener(this);
  AddonManager.addInstallListener(this);

  var self = this;
  gShutdown.push(function(){ self._shutdown(); });
}

//=================================================
// Extension implementation
Extension.prototype = {
  // cleanup observer so we don't leak
  _shutdown: function ext_shutdown() {
    AddonManager.removeAddonListener(this);
    AddonManager.removeInstallListener(this);

    this._prefs = null;
    this._storage = null;
    this._events = null;
  },

  // for AddonListener
  onDisabling: function(addon, needsRestart) {
    if (addon.id == this.id)
      this._events.dispatch("disable", this.id);
  },

  onEnabling: function(addon, needsRestart) {
    if (addon.id == this.id)
      this._events.dispatch("enable", this.id);
  },

  onUninstalling: function(addon, needsRestart) {
    if (addon.id == this.id)
      this._events.dispatch("uninstall", this.id);
  },

  onOperationCancelled: function(addon) {
    if (addon.id == this.id)
      this._events.dispatch("cancel", this.id);
  },

  onInstallEnded: function(install, addon) {
    if (addon.id == this.id)
      this._events.dispatch("upgrade", this.id);
  },

  get id() {
    return this._item.id;
  },

  get name() {
    return this._item.name;
  },

  get enabled() {
    return this._item.isActive;
  },

  get version() {
    return this._item.version;
  },

  get firstRun() {
    return this._firstRun;
  },

  get storage() {
    return this._storage;
  },

  get prefs() {
    return this._prefs;
  },

  get events() {
    return this._events;
  },

  QueryInterface : XPCOMUtils.generateQI([Ci.extIExtension])
};


//=================================================
// Extensions constructor
function Extensions(addons) {
  this._cache = {};

  addons.forEach(function(addon) {
    this._cache[addon.id] = new Extension(addon);
  }, this);

  var self = this;
  gShutdown.push(function() { self._shutdown(); });
}

//=================================================
// Extensions implementation
Extensions.prototype = {
  _shutdown : function exts_shutdown() {
    this._cache = null;
  },

  get all() {
    return this.find({});
  },

  // XXX: Disabled until we can figure out the wrapped object issues
  // id: "some@id" or /id/
  // name: "name" or /name/
  // version: "1.0.1"
  // minVersion: "1.0"
  // maxVersion: "2.0"
  find : function exts_find(aOptions) {
    return [e for each (e in this._cache)];
  },

  has : function exts_has(aId) {
    return aId in this._cache;
  },

  get : function exts_get(aId) {
    return this.has(aId) ? this._cache[aId] : null;
  },

  QueryInterface : XPCOMUtils.generateQI([Ci.extIExtensions])
};

//=================================================
// extApplication constructor
function extApplication() {
}

//=================================================
// extApplication implementation
extApplication.prototype = {
  initToolkitHelpers: function extApp_initToolkitHelpers() {
    XPCOMUtils.defineLazyServiceGetter(this, "_info",
                                       "@mozilla.org/xre/app-info;1",
                                       "nsIXULAppInfo");

    // While the other event listeners are loaded only if needed,
    // FUEL *must* listen for shutdown in order to clean up it's
    // references to various services, and to remove itself as
    // observer of any other notifications.
    this._obs = Cc["@mozilla.org/observer-service;1"].
                getService(Ci.nsIObserverService);
    this._obs.addObserver(this, "xpcom-shutdown", false);
    this._registered = {"unload": true};
  },

  classInfo: XPCOMUtils.generateCI({interfaces: [Ci.extIApplication,
                                                 Ci.nsIObserver],
                                    flags: Ci.nsIClassInfo.SINGLETON}),

  // extIApplication
  get id() {
    return this._info.ID;
  },

  get name() {
    return this._info.name;
  },

  get version() {
    return this._info.version;
  },

  // for nsIObserver
  observe: function app_observe(aSubject, aTopic, aData) {
    if (aTopic == "app-startup") {
      this.events.dispatch("load", "application");
    }
    else if (aTopic == "final-ui-startup") {
      this.events.dispatch("ready", "application");
    }
    else if (aTopic == "quit-application-requested") {
      // we can stop the quit by checking the return value
      if (this.events.dispatch("quit", "application") == false)
        aSubject.data = true;
    }
    else if (aTopic == "xpcom-shutdown") {

      this.events.dispatch("unload", "application");

      // call the cleanup functions and empty the array
      while (gShutdown.length) {
        gShutdown.shift()();
      }

      // release our observers
      this._obs.removeObserver(this, "app-startup");
      this._obs.removeObserver(this, "final-ui-startup");
      this._obs.removeObserver(this, "quit-application-requested");
      this._obs.removeObserver(this, "xpcom-shutdown");
    }
  },

  get console() {
    let console = new Console();
    this.__defineGetter__("console", function() console);
    return this.console;
  },

  get storage() {
    let storage = new SessionStorage();
    this.__defineGetter__("storage", function() storage);
    return this.storage;
  },

  get prefs() {
    let prefs = new PreferenceBranch("");
    this.__defineGetter__("prefs", function() prefs);
    return this.prefs;
  },

  getExtensions: function(callback) {
    AddonManager.getAddonsByTypes(["extension"], function(addons) {
      callback.callback(new Extensions(addons));
    });
  },

  get events() {

    // This ensures that FUEL only registers for notifications as needed
    // by callers. Note that the unload (xpcom-shutdown) event is listened
    // for by default, as it's needed for cleanup purposes.
    var self = this;
    function registerCheck(aEvent) {
      var rmap = { "load": "app-startup",
                   "ready": "final-ui-startup",
                   "quit": "quit-application-requested"};
      if (!(aEvent in rmap) || aEvent in self._registered)
        return;

      self._obs.addObserver(self, rmap[aEvent]);
      self._registered[aEvent] = true;
    }

    let events = new Events(registerCheck);
    this.__defineGetter__("events", function() events);
    return this.events;
  },

  // helper method for correct quitting/restarting
  _quitWithFlags: function app__quitWithFlags(aFlags) {
    let cancelQuit = Components.classes["@mozilla.org/supports-PRBool;1"]
                               .createInstance(Components.interfaces.nsISupportsPRBool);
    let quitType = aFlags & Components.interfaces.nsIAppStartup.eRestart ? "restart" : null;
    this._obs.notifyObservers(cancelQuit, "quit-application-requested", quitType);
    if (cancelQuit.data)
      return false; // somebody canceled our quit request

    let appStartup = Components.classes['@mozilla.org/toolkit/app-startup;1']
                               .getService(Components.interfaces.nsIAppStartup);
    appStartup.quit(aFlags);
    return true;
  },

  quit: function app_quit() {
    return this._quitWithFlags(Components.interfaces.nsIAppStartup.eAttemptQuit);
  },

  restart: function app_restart() {
    return this._quitWithFlags(Components.interfaces.nsIAppStartup.eAttemptQuit |
                               Components.interfaces.nsIAppStartup.eRestart);
  },

  QueryInterface : XPCOMUtils.generateQI([Ci.extIApplication, Ci.nsISupportsWeakReference])
};
//@line 724 "/builds/slave/rel-m-esr10-lnx-bld/build/browser/fuel/src/fuelApplication.js"

// set the proto, defined in extApplication.js
Application.prototype.__proto__ = extApplication.prototype;

var NSGetFactory = XPCOMUtils.generateNSGetFactory([Application]);

