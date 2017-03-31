'use strict';

/* eslint no-var: 0 */
var util = require('util');
var events = require('events');
var sprintf = require('sprintf-js').sprintf;

var AGIReply = function(line) {
  this.rawReply = line.trim();
  this.code = parseInt(this.rawReply);
  this.attributes = {};

  var self = this;

  var items = this.rawReply.split(' ');

  items.forEach(function(item) {
    if (item.indexOf('=') > 0) {
      var subItems = item.split('=');

      self.attributes[subItems[0]] = subItems[1];
    }
  });

  var m = this.rawReply.match(/\((.*)\)/);

  if (m) {
    this.extra = m[1];
  }
};


var AGIChannel = function(request, mapper) {
  events.EventEmitter.call(this);

  var self = this;

  self.request = request;
  self.cmdId = 0;

  if (typeof mapper == 'function') {
    mapper = {
      default: mapper
    };
  this} else if (typeof mapper != 'object') {
    self.emit('error', 'Invalid mapper');
    return;
  }

  // locate the script
  var script;

  if (request.network_script) {
    script = mapper[script];
  }

  if (!script) {
    script = mapper.default;
  }

  if (!script) {
    self.emit('error', 'Could not find requested script');
    return;
  }


  process.nextTick(function () {

    script(self)
      .then(function () {
        self.emit("done");
      }).catch(function (error) {
        self.emit("error", error);
      });

  });


};

util.inherits(AGIChannel, events.EventEmitter);

AGIChannel.prototype.handleReply = function (reply) {
  if (this.callback) {
    if (reply == 'hangup') {
      this.callback('hangup');
    } else {
      this.callback(null, new AGIReply(reply));
    }
  }
};


AGIChannel.prototype.sendRequest = function (request) {

  var self = this;

  return new Promise(function (resolve, reject) {

    self.callback= function(error, agiReply){

      if( error ){ 
        reject(error);
      }else{
        resolve(agiReply);
      }

    };

    self.cmdId = self.cmdId + 1;
    self.emit('request', request, self.cmdId);

  });

};


// external API
AGIChannel.prototype.answer = function () {

  var self = this;

  return new Promise(function (resolve, reject) {

    self.sendRequest("ANSWER")
      .then(function (result) {

        resolve(result.attributes.result || -1);

      }).catch(function (error) {

        reject(error);

      });


  });

};

AGIChannel.prototype.channelStatus = function (channelName) {

  var self = this;

  return new Promise(function (resolve, reject) {

    channelName = channelName || '';

    self.sendRequest(sprintf('CHANNEL STATUS %s', channelName))
      .then(function (result) {

        resolve(result.attributes.result || -1);

      }).catch(function (error) {

        reject(error);

      });


  });


};

AGIChannel.prototype.exec = function (app, params) {

  var self = this;

  return new Promise(function (resolve, reject) {

    if (params == undefined) {
      params = '';
    }

    self.sendRequest(sprintf('EXEC %s %s', app, params))
      .then(function (result) {

        resolve(result);

      }).catch(function (error) {

        reject(error);

      });


  });

};

AGIChannel.prototype.getData = function (file, timeout, maxDigits) {


  var self = this;

  return new Promise(function (resolve, reject) {

    timeout = (timeout == undefined) ? '' : timeout;
    maxDigits = (maxDigits == undefined) ? '' : maxDigits;

    self.sendRequest(sprintf('GET DATA "%s" %s %s', file, timeout, maxDigits))
      .then(function (result) {

        resolve(result.attributes.result);

      }).catch(function (error) {

        reject(error);

      });


  });


};

AGIChannel.prototype.getFullVariable = function (variable, channel) {

  var self = this;

  return new Promise(function (resolve, reject) {

    channel = (channel == undefined) ? '' : channel;

    self.sendRequest(sprintf('GET FULL VARIABLE %s %s', variable, channel))
      .then(function (result) {

        if (result.extra) {
          resolve(result.extra);
        } else {
          resolve(null);
        }

      }).catch(function (error) {

        reject(error);

      });

  });

};

AGIChannel.prototype.getOption = function (file, escapeDigits, timeout) {

  var self= this;

  return new Promise(function (resolve, reject) {

    escapeDigits = (escapeDigits == undefined) ? '' : escapeDigits;
    timeout = (timeout == undefined) ? '' : timeout;

    self.sendRequest(sprintf('GET OPTION "%s" %s" %s', file, escapeDigits, timeout))
      .then(function (result) {

        resolve(result);

      }).catch(function (error) {

        reject(error);

      });

  });


};

AGIChannel.prototype.getVariable = function (variable) {

  var self = this;

  return new Promise(function (resolve, reject) {

    self.sendRequest(sprintf('GET VARIABLE "%s"', variable))
      .then(function (result) {

        if (result.extra) {
          resolve(result.extra);
        } else {
          resolve(null);
        }


      }).catch(function (error) {

        reject(error);

      });

  });


};


AGIChannel.prototype.noop = function () {

  var self = this;

  return new Promise(function (resolve, reject) {

    self.sendRequest("NOOP")
      .then(function (result) {

        resolve(result);

      }).catch(function (error) {

        reject(error);

      });

  });

};

AGIChannel.prototype.recordFile = function (
  file,
  format,
  escapeDigits,
  timeout,
  silenceSeconds,
  beep
) {

  var self = this;

  return new Promise(function (resolve, reject) {

    format = format || 'wav';
    escapeDigits = escapeDigits || '';
    timeout = (timeout == undefined) ? -1 : timeout;
    silenceSeconds = (silenceSeconds == undefined) ? '' : 's=' + silenceSeconds;
    beep = (beep) ? 'BEEP' : '';

    self.sendRequest(
      sprintf(
        'RECORD FILE "%s" "%s" "%s" %s %s %s',
        file,
        format,
        escapeDigits,
        timeout,
        beep,
        silenceSeconds
      )
    ).then(function (result) {

      resolve(result);

    }).catch(function (error) {

      reject(error);

    });

  });


};


AGIChannel.prototype.streamFile = function (file, escapeDigits) {

  var self = this;

  return new Promise(function (resolve, reject) {

    escapeDigits = escapeDigits || '';

    self.sendRequest(sprintf('STREAM FILE "%s" "%s"', file, escapeDigits))
      .then(function (result) {

        resolve(result);

      }).catch(function (error) {

        reject(error);

      });

  });

};

AGIChannel.prototype.hangup = function () {

  var self = this;

  return new Promise(function (resolve, reject) {

    self.sendRequest("HANGUP")
      .then(function (result) {

        resolve(result);

      }).catch(function (error) {

        reject(error);

      });

  });
};


AGIChannel.prototype.setContext = function (context) {

  var self = this;

  return new Promise(function (resolve, reject) {

    self.sendRequest(sprintf('SET CONTEXT %s', context))
      .then(function (result) {

        resolve(result);

      }).catch(function (error) {

        reject(error);

      });

  });
};

AGIChannel.prototype.setExtension = function (extension) {

  var self = this;

  return new Promise(function (resolve, reject) {

    self.sendRequest(sprintf('SET EXTENSION %s', extension))
      .then(function (result) {

        resolve(result);

      }).catch(function (error) {

        reject(error);

      });

  });


};

AGIChannel.prototype.setPriority = function (priority) {

  var self = this;

  return new Promise(function (resolve, reject) {

    self.sendRequest(sprintf('SET PRIORITY %s', priority))
      .then(function (result) {

        resolve(result);

      }).catch(function (error) {

        reject(error);

      });

  });

};

AGIChannel.prototype.setVariable = function (variable, value) {

  var self = this;

  return new Promise(function (resolve, reject) {

    self.sendRequest(sprintf('SET VARIABLE %s %s', variable, value))
      .then(function (result) {

        resolve(result);

      }).catch(function (error) {

        reject(error);

      });

  });

};

AGIChannel.prototype.continueAt = function (context, extension, priority) {

  var self = this;

  return new Promise(function (resolve, reject) {
    extension = extension || self.request.extension;
    priority = priority || 1;

    Promise.all([
      self.setContext(context),
      self.setExtension(extension),
      self.setPriority(priority)
    ]).then(function () {
      resolve();
    }).catch(function (error) {
      reject(error);
    });


  });

};

AGIChannel.parseBuffer = function (buffer) {
  var request = {};

  buffer.split('\n').forEach(function (line) {
    var items = line.split(/:\s?/);

    if (items.length == 2) {
      var name = items[0].trim();

      if (name.indexOf('agi_') == 0) {
        name = name.substring(4);
      }
      var value = items[1].trim();

      request[name] = value;
    }
  });

  return request;
};


module.exports = AGIChannel;
