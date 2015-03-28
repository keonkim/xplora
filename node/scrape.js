var CronJob, LD, YouTube, async, blacklist, checkWhitelist, cheerio, date, fs, gaon_kor_url, gapi_key, get_data, has_korean, http, mnet_kor_url, mnet_url, mnet_vote_url, moment, out_file, request, songDataReady, songs, update_data, urls, whitelist, youTube,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

gapi_key = "AIzaSyCOHL5Z1IEHvbbt71ASsVbMWwZnP9JUOjg";

http = require("http");

request = require("request");

cheerio = require("cheerio");

fs = require("fs");

CronJob = require("cron").CronJob;

YouTube = require("youtube-node");

moment = require("moment");

async = require("async");

youTube = new YouTube();

songs = [];

out_file = "../songs.json";

mnet_url = "http://mwave.interest.me/kpop/chart.m";

mnet_kor_url = "";

gaon_kor_url = "http://gaonchart.co.kr/main/section/chart/online.gaon?serviceGbn=S1040&termGbn=week&hitYear=2015&targetTime=13&nationGbn=K";

mnet_vote_url = "http://mwave.interest.me/mcountdown/voteState.m";

urls = [mnet_url, mnet_vote_url, gaon_kor_url];

date = moment().subtract(3, "months").format("YYYY-MM-DDTHH:mm:ssZ");

blacklist = ["simply k-pop", "tease", "teaser", "phone", "iPhone", "iPad", "Gameplay", "cover", "acoustic", "instrumental", "remix", "mix", "re mix", "re-mix", "version", "ver.", "live", "live cover", "accapella", "cvr"];

whitelist = ["mnet", "full audio", "kpop", "k pop", "k-pop", "korean", "korea", "kor", "kor pop", "korean pop", "korean-pop", "kor-pop", "korean version", "kr", "kr ver", "official", "mv", "m/v", "music video"];

has_korean = /[\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7AF\uD7B0-\uD7FF]/g;

youTube.setKey(gapi_key);

youTube.addParam("type", "video");

youTube.addParam("part", "id");

youTube.addParam("order", "relevance");

youTube.addParam("publishedAfter", date);

youTube.addParam("videoDefinition", "high");

youTube.addParam("videoEmbeddable", "true");

LD = function(s, t) {
  var c1, c2, cost, d, i, j, m, n, _i, _j, _k, _l, _len, _len1, _m;
  n = s.length;
  m = t.length;
  if (n === 0) {
    return m;
  }
  if (m === 0) {
    return n;
  }
  d = [];
  for (i = _i = 0; 0 <= n ? _i <= n : _i >= n; i = 0 <= n ? ++_i : --_i) {
    d[i] = [];
  }
  for (i = _j = 0; 0 <= n ? _j <= n : _j >= n; i = 0 <= n ? ++_j : --_j) {
    d[i][0] = i;
  }
  for (j = _k = 0; 0 <= m ? _k <= m : _k >= m; j = 0 <= m ? ++_k : --_k) {
    d[0][j] = j;
  }
  for (i = _l = 0, _len = s.length; _l < _len; i = ++_l) {
    c1 = s[i];
    for (j = _m = 0, _len1 = t.length; _m < _len1; j = ++_m) {
      c2 = t[j];
      cost = c1 === c2 ? 0 : 1;
      d[i + 1][j + 1] = Math.min(d[i][j + 1] + 1, d[i + 1][j] + 1, d[i][j] + cost);
    }
  }
  return d[n][m];
};

checkWhitelist = function(song, query) {
  var cleaned_description, cleaned_query, cleaned_title, description, descriptionCount, description_array, goodDescription, goodTitle, query_array, query_count, score, term, title, titleCount, title_array, word, _i, _j, _len, _len1;
  title = song.snippet.title;
  description = song.snippet.description;
  score = 0;
  query_count = 0;
  cleaned_title = title.replace(/[^A-Za-z0-9\s]+/g, "").replace(/\s+/g, ' ').toLowerCase().trim();
  cleaned_description = description.replace(/[^A-Za-z0-9\s]+/g, "").replace(/\s+/g, ' ').toLowerCase().trim();
  cleaned_query = query.replace(/[^A-Za-z0-9\s]+/g, "").replace(/\s+/g, ' ').toLowerCase().trim();
  if (has_korean.test(title) === true) {
    score++;
  }
  if (has_korean.test(description) === true) {
    score++;
  }
  goodTitle = 0;
  goodDescription = 0;
  for (_i = 0, _len = whitelist.length; _i < _len; _i++) {
    term = whitelist[_i];
    if (title.indexOf(term) !== -1) {
      goodTitle++;
    }
    if (description.indexOf(term) !== -1) {
      goodDescription++;
    }
  }
  if (goodTitle > 0) {
    score++;
  }
  if (goodDescription > 0) {
    score++;
  }
  title_array = cleaned_title.split(" ");
  description_array = cleaned_description.split(" ");
  query_array = cleaned_query.split(" ");
  titleCount = 0;
  descriptionCount = 0;
  for (_j = 0, _len1 = query_array.length; _j < _len1; _j++) {
    word = query_array[_j];
    if (__indexOf.call(title_array, word) >= 0) {
      titleCount++;
    }
    if (__indexOf.call(description_array, word) >= 0) {
      descriptionCount++;
    }
  }
  if (titleCount = query_array.length || (descriptionCount = query_array.length)) {
    score += 3;
  }
  return score;
};

get_data = function(url, callback) {
  return request(url, function(error, response, html) {
    var $;
    if (error) {
      console.log(error);
    }
    if (!error && response.statusCode === 200) {
      $ = cheerio.load(html);
      if (url === mnet_url) {
        $("div.list_song tr").each(function(i, element) {
          var artist, mwave, query, rank, title;
          artist = $(this).find(".tit_artist a:first-child").text().replace("(", "").replace(")", "").replace("'", "");
          title = $(this).find(".tit_song a").text().replace("(", "").replace(")", "").replace("'", "");
          rank = $(this).find(".nb em").text();
          query = "" + artist + " " + title;
          if ((artist != null) && artist !== "") {
            mwave = {
              artist: artist,
              title: title,
              query: query.toLowerCase(),
              rank: rank
            };
            return songs.push(mwave);
          }
        });
      }
      if (url === mnet_vote_url) {
        $(".vote_state_list tr").each(function(i, element) {
          var artist, mnet, query, rank, title;
          artist = $(this).find(".artist a").text().replace("(", "").replace(")", "").replace("'", "");
          title = $(this).find(".music_icon a:nth-child(2)").text().replace("(", "").replace(")", "").replace("'", "");
          rank = $(this).find(".rank img").attr("alt");
          query = "" + artist + " " + title;
          if ((artist != null) && artist !== "") {
            mnet = {
              artist: artist,
              title: title,
              query: query.toLowerCase(),
              rank: rank
            };
            return songs.push(mnet);
          }
        });
      }
      if (url === gaon_kor_url) {
        $(".chart tr").each(function(i, element) {
          var artist, gaon, query, rank, title;
          artist = $(this).find(".subject p:nth-child(2)").text().split("|")[0].replace("(", "").replace(")", "").replace("'", "");
          title = $(this).find(".subject p:first-child").text().replace("(", "").replace(")", "").replace("'", "");
          rank = $(this).find(".ranking span").text();
          if (rank === "") {
            rank = $(this).find(".ranking").text();
          }
          query = "" + artist + " " + title;
          if ((artist != null) && artist !== "") {
            gaon = {
              artist: artist,
              title: title,
              query: query.toLowerCase(),
              rank: rank
            };
            return songs.push(gaon);
          }
        });
      }
      return callback();
    }
  });
};

update_data = function() {
  return async.each(urls, (function(url, callback) {
    get_data(url, function() {
      console.log("in get data " + url);
      return callback();
    });
  }), function(err) {
    var key, match_query, match_title, q, t, unique, unique_queries, unique_titles, x, y, _i, _j, _len, _len1;
    if (err) {
      console.log(err);
    } else {
      console.log("in return");
      unique = [];
      for (_i = 0, _len = songs.length; _i < _len; _i++) {
        x = songs[_i];
        unique_queries = (function() {
          var _j, _len1, _results;
          _results = [];
          for (_j = 0, _len1 = unique.length; _j < _len1; _j++) {
            q = unique[_j];
            _results.push(q.query);
          }
          return _results;
        })();
        unique_titles = (function() {
          var _j, _len1, _results;
          _results = [];
          for (_j = 0, _len1 = unique.length; _j < _len1; _j++) {
            t = unique[_j];
            _results.push(t.title);
          }
          return _results;
        })();
        match_query = (function() {
          var _j, _len1, _results;
          _results = [];
          for (_j = 0, _len1 = unique_queries.length; _j < _len1; _j++) {
            q = unique_queries[_j];
            if (LD(x.query, q) < 3) {
              _results.push(q);
            }
          }
          return _results;
        })();
        match_title = (function() {
          var _j, _len1, _results;
          _results = [];
          for (_j = 0, _len1 = unique_titles.length; _j < _len1; _j++) {
            t = unique_titles[_j];
            if (LD(x.title, t) < 3) {
              _results.push(t);
            }
          }
          return _results;
        })();
        if (match_query.length === 0 && match_title.length === 0) {
          unique.push(x);
        }
      }
      unique.sort(function(x, y) {
        return x.rank - y.rank;
      });
      for (key = _j = 0, _len1 = unique.length; _j < _len1; key = ++_j) {
        y = unique[key];
        y.rank = key + 1;
      }
      songs = unique;
      async.each(songs, (function(song, callback) {
        return youTube.search(song.query, 50, function(error, r1) {
          var s;
          if (error) {
            console.log(error);
            return callback();
          } else if (r1.pageInfo.totalResults < 10) {
            console.log("not enough songs for " + song.query);
            return callback();
          } else if (!r1.items[0]) {
            console.log("no matches for " + song.query);
            return callback();
          } else if (r1.items[0].id == null) {
            console.log("no id for " + song.query);
            return callback();
          } else {
            s = r1.items[0].id.videoId;
            return youTube.getById(s, (function(error, r2) {
              var bad, description, j, score, term, title, viewCount, _k, _len2;
              if (error) {
                console.log(error);
                return callback();
              } else {
                j = r2.items[0];
                title = j.snippet.title;
                description = j.snippet.description;
                viewCount = j.statistics.viewCount;
                bad = 0;
                for (_k = 0, _len2 = blacklist.length; _k < _len2; _k++) {
                  term = blacklist[_k];
                  if (title.indexOf(term) !== -1) {
                    bad++;
                  }
                  if (description.indexOf(term) !== -1) {
                    bad++;
                  }
                }
                score = checkWhitelist(j, song.query);
                if (bad > 1 || score < 3 || viewCount < 5000) {
                  console.log("" + song.query + " doesn't pass checks: score: " + score + ", bad: " + bad);
                  return callback();
                } else {
                  song.youtubeId = s;
                  song.statistics = j.statistics;
                  return callback();
                }
              }
            }));
          }
        });
      }), function(err) {
        if (err) {
          return console.log(err);
        } else {
          console.log('All songs have been processed successfully');
          return songDataReady();
        }
      });
    }
  });

  /*
  get_data mnet_url, (data) ->
    songs = data
    async.each songs, ((song, callback) ->
      youTube.search(song.query, 50, (error, r1) ->
  
        if error
          console.log error
          callback()
  
        else if r1.pageInfo.totalResults < 10
          console.log "not enough songs for #{song.query}"
          callback()
  
        else if not r1.items[0]
          console.log "no matches for #{song.query}"
          callback()
  
        else if not r1.items[0].id?
          console.log "no id for #{song.query}"
          callback()
  
        else
          s = r1.items[0].id.videoId
          youTube.getById s, (error, r2) ->
            if error
              console.log error
              callback()
  
            else
              j = r2.items[0]
              title = j.snippet.title
              description = j.snippet.description
              viewCount = j.statistics.viewCount
              bad = 0
              for term in blacklist
                if title.indexOf(term) isnt -1 then bad++
                if description.indexOf(term) isnt -1 then bad++
  
              score = checkWhitelist(j,song.query)
  
              if bad > 1 or score < 3 or viewCount < 5000
                console.log "#{song.query} doesn't pass checks: score: #{score}, bad: #{bad}"
                callback()
  
              else
                song.youtubeId = s
                song.statistics = j.statistics
                callback()
  
      )
      return
    ), (err) ->
      if err then console.log err
      else
        console.log 'All songs have been processed successfully'
        songDataReady()
   */
};

songDataReady = function() {
  return fs.writeFile(out_file, JSON.stringify(songs), function(err) {
    if (err) {
      throw err;
    }
    console.log("JSON saved to " + out_file);
  });

  /*
  request.post
    url: "http://jombly.com:3000/update"
    body: JSON.stringify songs
    headers: {"Content-Type": "application/json;charset=UTF-8"}
  , (error, response, body) ->
    console.log "error code: #{error}"
    console.log "status code: #{response.statusCode}"
    return
   */
};

update_data();
