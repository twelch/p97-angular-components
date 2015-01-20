/*
Github Repo: https://github.com/point97/p97-angular-components.git
Version: v15.01.16a

*/

angular.module('vpApi.services', [])

.service( '$vpApi', ['$rootScope', '$http', 'config', function($rootScope, $http, config) {
    var obj = this;
    var apiBase = config.apiBaseUri;
    this.username = '';
    this.user = {};
    this.users;
    this.dbLoaded = false
    this.dbinit = function(initCallback){
        /*
            Loads or creates the database. 

            Sets

            this.db
            this.user - A user object with keys: username, token
        */

        // Makes the loki database available at $vpApi.db.
        obj.db = data.db;
        obj.user = data.user;
        obj.users = data.db.getCollection('user');
        obj.dbLoaded = true;
        return;

        if (obj.dbLoaded === true) { 
            initCallback();
            return;
        }

        obj.loadHandler = function(){
            obj.users = obj.db.getCollection('user');

            if (obj.users && obj.users.data.length > 0 && obj.users.data[0].username){
                obj.user = obj.users.data[0];
            } else {
                obj._createDb();
            }
            obj.dbLoaded = true;
            $rootScope.$broadcast('db_loaded');
            initCallback();

        };

        var idbAdapter = new lokiIndexedAdapter('vpsurvey');
        obj.db = new loki(config.dbFilename, { 
            'adapter': idbAdapter,
            'autoload': true,
            'autoloadCallback': obj.loadHandler
        });
    }

    this.getApp = function(slug){
        var apps = $vpApi.db.getCollection('app');
        var app = apps.find({'slug':slug})[0];
        if (app.length > 0){
            return app;
        }else{
            console.log("eror getting app.")
        }
    }

    this.getFormstack = function(slug){
        console.log(slug)
        var out = null;
        var formstacks = obj.db.getCollection('formstack')
        if(slug == undefined || slug == null){
            out = formstacks.find()[0];
        }else{
            out = formstacks.find({'slug':slug})[0]
        }
        if(!out)
            console.error('[$vpApi.getFormstack()] Could not find formstack');

        return out;
    }

    this.getTimestamp = function(){
        return new Date().toISOString();
    }

    this.serialize = function(obj) {
        var str = [];
        for(var p in obj)
        if (obj.hasOwnProperty(p)) {
          str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
        return str.join("&");
    }

    this.authenticate = function(data, success_callback, error_callback) {
        /*
        Inputs:
            data : object with keywords username, password, stayLoginIn
        */
        var url = apiBase + 'authenticate/';

        var headers = {}// {'Authorization':'Token ' + this.user.token};
        $http.post(url, data, headers)
            .success(function(res, status){
                var users = obj.users.find({'username': data.username});
                if (users.length === 0){
                    user = obj.users.insert({'username':data.username, token:res.token})
                } else {
                    user = users[0];
                    user.token = res.token;
                    user.username = data.username;
                    obj.users.update(user);
                }
                obj.user = user;

                obj.db.save();
                localStorage.setItem('user', JSON.stringify(obj.user));
                $rootScope.$broadcast('authenticated', {onSuccess: success_callback});
            })
            .error(function(data, status){
                error_callback(data, status)
            });
    }

    this.fetch  = function(resource, data, success, fail){

        var url = apiBase + resource + '/';
        var qs = this.serialize(data);
        url += "?" + qs;

        var config = {headers: {'Authorization':'Token ' + this.user.token}};

        $http.get(url, config).success(function(data, status){
          success(data, status);
        })
        .error(function(data, status){
          fail(data, status);
        });
    }

    this.post = function(resource, data, success, fail){
        var url = apiBase + resource + '/';
        var config = {headers: {'Authorization':'Token ' + this.user.token}};
        $http({url:url,
              method:'POST',
              data: data,
              headers: {'Authorization':'Token ' + this.user.token}
        }).success(function(data, status){
          success(data, status);
        })
        .error(function(data, status){
          fail(data, status);
        });
    }

    this.showCollection = function(collectionName){
        console.log("SHOW TABLE: " + collectionName);
        console.table(data.db.getCollection(collectionName).data);
    }

    this.dbinit();

}])

.service('$user', ['$rootScope', '$vpApi', '$app', '$formstack', '$profile', function($rootScope, $vpApi, $app, $formstack, $profile){
    var obj = this;

    $rootScope.$on('authenticated', function(event, args){
        $profile.fetch(function(){
            $vpApi.db.save(); // This is to save the profile to indexedDB.

            allowedApps = $vpApi.user.profile.allowed_apps;
            if (allowedApps.length > 0) {
                appSlug = allowedApps[0];
            } else {
                console.error("There are no allowed Apps for this user.");
                // TODO Handle the no formstack case.
            }

            // Now use the allowed_apps to get first app.
            $app.fetchBySlug(appSlug,
                function(data, status){
                    formstacks = data["formstacks"];
                    //Clear data
                    oldStacks = $vpApi.db.getCollection('formstack').find();
                    _.each(oldStacks, function(old){
                        $vpApi.db.getCollection('formstack').remove(old);
                    });
                    // Insert Most recent Fromstack data
                    _.each(formstacks, function(formstack){
                        formstack.appId = data.id;
                        formstack.appSlug = data.slug;
                        $vpApi.db.getCollection('formstack').insert(formstack);
                    });

                    // Save the changes
                    $vpApi.db.save();
                    $rootScope.$broadcast('apploaded');
                    args.onSuccess();
                },
                function(data, status){
                    console.log('[$user] failed to fetch formstack');
                    console.log(data);
                }
            );
        },
        function(data, status){
            console.log('Error fetching profile.');
        });
    })
}])

.service( '$profile', ['$http', '$vpApi', 'config', function($http, $vpApi, config){
    var obj = this;
    var apiBase = config.apiBaseUri;

    this.fetch = function(successCallback, errorCallback){
        /*
        Fetches profile and updates the obj.db. DOSE NOT save to localStorage
        */
        var url = apiBase +'account/info/?user__username=';
        var token = $vpApi.user.token;

        var headers = {headers: {'Authorization':'Token ' + token}};
        $http.get(url+$vpApi.user.username, headers)
            .success(function(data, status){
                $vpApi.user.profile = data[0];
                $vpApi.users.update($vpApi.user);
                successCallback();
            }).error(function(data, status){
                errorCallback()
            });
    };

}])

.service('$app', ['$vpApi', function($vpApi) {
    var obj = this;
    this.resource_name = 'pforms/get/app';

    this._fetchSuccess = function(data, status){
        obj.objects = data;
        var apps = $vpApi.db.getCollection('app');
        var app = apps.find({'slug':data[0].slug});
        if (app.length > 0){
            apps.remove(app);
        }
        apps.insert(data[0]);
    };

    this._fetchFail = function(data, status){
        console.log("Failed to fetch " + obj.resource_name + ". Returned Status: " + status);
        console.log(data);
    }

    this.fetchBySlug = function(slug, successCallback, errorCallback){
        /*
        Get the formstack from the VP2 server. 
        */

        if(HAS_CONNECTION){
          $vpApi.fetch(
            this.resource_name, 
            {'slug':slug}, 
            function(data, status){
                obj.objects = data;

                var apps = $vpApi.db.getCollection('app');
                var app = apps.find({'slug':slug});
                if (app.length > 0){
                    apps.remove(app);
                }
                apps.insert(data[0]);
                successCallback(data[0], status);
            },
            function(data, status){
                console.log("Failed to fetch " + obj.resource_name + ". Returned Status: " + status);
                console.log(data);
                errorCallback(data, status)
            }
          );

        }else{
            debugger
        }

    }; // fetchBySlug

    this.updateBySlug = function(slug, success, error) {
        /*
        Inputs:
            slug - [String]

            success - [Function] the success callback. This will called with arguements 
                        formstack, status from the $http.get. 
            
            error -  [Fucntion] the error callback. This will be called with arguments 
                         data, status from the $http.get
        */

        var data = {'slug':slug};
        
        $vpApi.fetch(this.resource_name, data, 
            function(data, status){
                obj._fetchSuccess(data, status);
                success(data[0]);
            },
            function(data, status){
                obj._fetchFail(data, status);
                error(data, status);
            }
        );
    };

}])

.service('$formstack', ['$vpApi', function($vpApi) {
    var obj = this;
    this.resource_name = 'pforms/formstack';

    this.formRepeatItem;  // TODO Find a better place for this. Mayeb a state service, will probably want the rest of the state stored to.


    this._fetchSuccess = function(data, status){
        obj.objects = data;
        var formstacks = $vpApi.db.getCollection('formstack');
        var formstack = formstacks.find({'slug':data[0].slug});
        if (formstack.length > 0){
            formstacks.remove(formstack);
        }
        formstacks.insert(data[0]);
    };

    this._fetchFail = function(data, status){
        console.log("Failed to fetch " + obj.resource_name + ". Returned Status: " + status);
        console.log(data);
    }

    this.fetchBySlug = function(slug, successCallback, errorCallback){
        /*
        Get the formstack from the VP2 server. 
        */

        if(HAS_CONNECTION){
          $vpApi.fetch(
            this.resource_name, 
            {'slug':slug}, 
            function(data, status){
                obj.objects = data;

                var formstacks = $vpApi.db.getCollection('formstack');
                var formstack = formstacks.find({'slug':slug});
                if (formstack.length > 0){
                    formstacks.remove(formstack);
                }
                formstacks.insert(data[0]);
                successCallback(data[0], status);
            },
            function(data, status){
                console.log("Failed to fetch " + obj.resource_name + ". Returned Status: " + status);
                console.log(data);
                errorCallback(data, status)
            }
          );

        }else{
            debugger
        }

    }; // fetchBySlug

    this.updateBySlug = function(slug, success, error) {
        /*
        Inputs:
            slug - [String]

            success - [Function] the success callback. This will called with arguements
                        formstack, status from the $http.get.

            error -  [Fucntion] the error callback. This will be called with arguments
                         data, status from the $http.get
        */

        var data = {'slug':slug};

        $vpApi.fetch(this.resource_name, data,
            function(data, status){
                obj._fetchSuccess(data, status);
                success(data[0]);
            },
            function(data, status){
                obj._fetchFail(data, status);
                error(data, status);
            }
        );
    };

    this.getQuestionBySlug = function(slug) {
        var fs = $vpApi.db.getCollection('formstack').data[0];
        var out;
        _.find(fs.forms, function(form){
            blockRes = _.find(form.blocks, function(block){
                qRes = _.find(block.questions, function(q){
                    if (q.slug === slug){
                        out = q;
                        return true;
                    }
                });
                return qRes;
            });
            return blockRes;
        });
        return out;
    };

    this.getChoice = function(qSlug, value){
        /*
            Get's a questions choice by question slug and value.
            Handles the 'other' answer case
        */
        var choice;
        var question = obj.getQuestionBySlug(qSlug);
        choice = _.find(question.choices, function(item){return(item.value === value);});
        if (!choice) {
            choice = {'verbose': 'User Enter: ' + value, 'value': value };
        }
        return choice;
    };

}])

.service('$fsResp', ['$vpApi', '$rootScope', function($vpApi, $rootScope){
    /*
        A form response is of the form
        {
            id:
            fsSlug:
        }
    */

    var obj = this;
    this.resource_name = 'pforms/formstack-response';

    $rootScope.$on('db_loaded', function(e){
        this.objects = $vpApi.db.getCollection('fsResp');
    })

    this.delete = function(fsRespId){

        var fsResp = obj.objects.get(fsRespId);
        obj.objects.remove(fsResp);


        var formResps = $vpApi.db.getCollection('formResp').find({'fsRespId': fsRespId});
        var blockResps = $vpApi.db.getCollection('blockResp').find({'fsRespId': fsRespId});
        var answers = $vpApi.db.getCollection('answer').find({'fsRespId': fsRespId});


        _.each(formResps, function(resp){
            $vpApi.db.getCollection('formResp').remove(resp);
        });

        _.each(blockResps, function(resp){
            $vpApi.db.getCollection('blockResp').remove(resp);
        });

        _.each(answers, function(resp){
            $vpApi.db.getCollection('answer').remove(resp);
        });

        $vpApi.db.save();
    }
}])

.service('$formResp', ['$vpApi', function($vpApi){
    /*
        A form response is of the form
        {
            id:
            fsRespId:
            fsSlug:
        }
    */

    var obj = this;
    this.resource_name = 'pforms/form-response';

    //this.objects = $vpApi.db.getCollection('formResp');

    this.delete = function(formRespId){

        var formResp = $vpApi.db.getCollection('formResp').get(formRespId);
        if (formResp) {
            var blockResps = $vpApi.db.getCollection('blockResp').find({'formRespId': formRespId});
            var answers = $vpApi.db.getCollection('answer').find({'formRespId': formRespId});
        } else {
            console.warn("Form Response does not exist: " + formRespId);
            return;
        }

        // Remove the responses
        $vpApi.db.getCollection('formResp').remove(formResp);
        _.each(blockResps, function(resp){
            $vpApi.db.getCollection('blockResp').remove(resp);
        });

        _.each(answers, function(resp){
            $vpApi.db.getCollection('answer').remove(resp);
        });
        $vpApi.db.save();
    }
}])

.service('$blockResponse', ['$formstack', '$block', '$rootScope', '$answers', '$formResponse', function($formstack, $block, $rootScope, $answers, $formResponse){
    /*
        A block response is of the form
        {
            id:
            fsRespId:
            fsSlug:
            formRespId:
            formId:
        }
    */
    var obj = this;
    this.resource_name = 'pforms/block-response'; //This is currently client side only

    $rootScope.$on('answer-created', function(event, data){
        debugger;
    })

}])

.service( '$answers', ['$form', '$rootScope', '$filter', '$vpApi', 'config',
               function($form, $rootScope, $filter, $vpApi, config) {
  /*
    An answer will be of the form
    {
        id:
        value:   <-- This is what the question type directive outputs.
        valueType:
        blockRespId:
        blockId:
        formRespId:
        formId:
        fsRespId:
        fsSlug:
        cupdate:
    }

  */

  var obj = this;
  this.resource_name = "pforms/answer";

}])

.service('$mediacache', ['$vpApi', '$formstack', '$http', function($vpApi, $formstack, $http){
    var obj = this;
    obj.isCached = false;

    this.run = function(){
        /*
        This should run when the app first loads.

        It uses getFileNames to return  alist of file names to
        request from the server and caches them in a Colleciton named
        'media' with a keywords 'filename' and 'data'

        */
        var fnames = obj.getFilenames();
        // Cache all geojsonChoices
        _.each(fnames, function(fname){
            $http({
                method: 'GET',
                withCredentials: true,
                url: fname
            }).success(function(data) {
                // Save this to persistent storage

                var medias = $vpApi.db.getCollection('media');
                var entry = medias.find({'fname':fname});
                if (entry.length > 0){
                    entry.cupdate = $vpApi.getTimestamp();
                    medias.update(entry);
                } else {
                    entry = {
                        'fname':fname,
                        'data':data,
                        'cupdate': $vpApi.getTimestamp()
                    }
                    medias.insert(entry);
                }
                $vpApi.db.save();

            }).error(function(data, status){
                console.log("Could not load media file ")
            });
        });
    };

    this.getFilenames = function(){
        // Get loop over formstack and get a list of files names to cache
        var fs = $vpApi.getFormstack();
        var fnames = [];
        _.each(fs.forms, function(form){
            _.each(form.blocks, function(block){
                _.each(block.questions, function(q){
                    if (q.options.geojsonChoices && q.options.geojsonChoices.url){
                        fnames.push(q.options.geojsonChoices.url);
                    }
                }); // End questions loop
            }); // End block loop
        }); // End forms loop
        fnames = _.uniq(fnames);
        console.log("[getFilenames] Files to cache: ");
        console.log(fnames);
        return fnames;
    }

}])

.service('$tilecache', ['$vpApi', '$formstack', '$timeout', function($vpApi, $formstack, $timeout){
    /*
    Handles tiles caching.
    */
    var obj = this;
    this.regions = [];
    this.cacheTimer = {'start':null, 'stop':null, 'elasped':null};


    this.isCached = function(){
        var rs = localStorage.getItem('tilesCached');
        var out = (rs === 'true') ? true : false;
        return out;

    }
    this.getMaxCacheZoom = function(){
        /*
        returns the options.maxCacheZoom from the first map-form it finds in forms.
        */
        var out;
        var fs = $vpApi.getFormstack();
        var mapForm = _.find(fs.forms, function(form){
            return (form.type === 'map-form');
        })

        if (mapForm) {
            out =  mapForm.options.maxCacheZoom;
        } else {
            out =  null;
        }
        return out;
    }

    this.getRegions = function(){
        /*
        Look for forms with Regions.
        Returns the list of regions or an empty list.
        */
        var out = [];
        var fs = $vpApi.getFormstack();

        _.each(fs.forms, function(form){
            if (form.type === 'map-form' && form.options.regions) {
                out = _.uniq( out.concat(form.options.regions) );
            }
        });
        obj.regions = out;
        return out;
    }

    this.getTileSources = function(){
        /*
        Look for the first map-form with tile sources
        and returns those sources in an array of objects

        This means caching will be derived ONLY from the first set of tile sources

        In the future the tile sources should be defined at the formstack level
        */

        var out = [];
        var fs = $vpApi.getFormstack();

        var form = _.find(fs.forms, function(formItem){
            return (formItem.type === 'map-form' && formItem.options.tileSources)
        });
        obj.tileSources = form.options.tileSources;
        return obj.tileSources;
    }

    this.loadRegions = function(layer, onSuccess, onError){
        if (obj.regions.length === 0) {
            obj.getRegions();
            if (obj.regions.length === 0);
            return
        }
        var maxZoom = obj.getMaxCacheZoom();
        var nbTiles = layer.calculateNbTiles(maxZoom, obj.regions);

        console.log("Will be saving: " + nbTiles + " tiles")
        layer.saveRegions(obj.regions, maxZoom, 
          function(){
            console.log('[saveRegions] onStarted');
          },
          function(){
            console.log('[saveRegions] onSuccess');
            obj.cacheTimer.stop = new Date();
            obj.cacheTimer.elasped = obj.cacheTimer.stop - obj.cacheTimer.start;
            console.log("Cache timer elapsed time (min): " + obj.cacheTimer.elasped/1000/60)

            localStorage.setItem('tilesCached', 'true');
            onSuccess();
          },
          function(error){
            console.log('onError');
            console.log(error);
            onError();
          })

    } // end loadRegions.

    this.run = function(success, error){
        obj.offlineLayers = [];
        obj.cacheTimer.start = new Date();
        // These need to be passed in from form.options
        // var mapquestUrl = 'http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png'
        // var subDomains = ['otile1','otile2','otile3','otile4']
        // var mapquestAttrib = 'Data, imagery and map information provided by <a href="http://open.mapquest.co.uk" target="_blank">MapQuest</a>, <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and contributors.'

        var tileSources = obj.getTileSources();

        onError = function(errorType, errorData1, errorData2){
            /*
                Fires when $tilecache errors out during tile caching.
            */
            console.log("[$tilecache.run.onError()] ");
            localStorage.setItem('tilesCached', 'false');
            console.log(errorType)
            console.log(errorData1)
            console.log(errorData2)
            error();
        }

        // Initalize a map
        var map = L.map('cache-map').setView([-2.9, -79], 13);

        _.each(tileSources, function(tileSource) {
            var options = {
            map: map,
            maxZoom: obj.getMaxCacheZoom(), 
            attribution: tileSource.attrib, 
            subdomains: tileSource.subdomain,
            dbOnly: true, 
            onReady: function(){console.log("onReady for what?")}, // Not sure what these do
            onError: function(){console.log("onError for what?")},  // Not sure what this does
            storeName:tileSource.storeName,  // this is the objectStore name.
            dbOption:"IndexedDB" // "WebSQL"
            }
            var layer = new OfflineLayer(tileSource.url, options);
            obj.offlineLayers.push(layer);
            $timeout(function(){
                obj.loadRegions(layer, success, error);
            }, 1000);
        })
    };

    this.clearTiles = function(){
        /*
        Depracted 1/11/2015. Do not use
        */
        console.log('clearing tiles...');
        obj.offlineLayer.clearTiles(
            function(){
                console.log('[clearTiles] success')
            },function(error) {
                console.log('[clearTiles] fail')
            }
        );
    }

    this.clearTilesDb = function(callback){
        /*
        Use this to clear the tiles database from indexedDB
        */

        tilesSources = obj.getTileSources();

        osTableName = tilesSources[0].storeName;
        dbName = "IDBWrapper-" + osTableName;

        var openRequest = window.indexedDB.open(dbName, 1); //version used
        openRequest.onerror = function (e) {
            console.log("[openTilesDb] Database error: " + e.target.errorCode);
        };
        openRequest.onsuccess = function (event) {

            window.db = openRequest.result;
            console.log("[openTilesDb] Opened "+dbName+" with dataStores");
            console.log(window.db.objectStoreNames);

            var store = window.db.transaction(osTableName, "readwrite").objectStore(osTableName);

            store.clear().onsuccess = function (event) {
                localStorage.removeItem("tilesCached");
                console.log('Finished clearing records');
                callback(event);
            };
        };
    };
}])