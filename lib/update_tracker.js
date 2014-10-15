/* Keeps track of updates and knows when it's time for a new update.
 *
 * Example:
 *
 * var servicesUpdateTracker = new UpdateTracker({storageKey: 'servicesLastUpdatedAt', daysBetweenUpdates: 7})
 *
 * storage: string, name of the simple storage key which holds the last updated date
 * daysBetweenUpdates: integer, interval in days between updates
 */

var UpdateTracker = (function() {
  function UpdateTracker(arg) {
    this.ss = require("sdk/simple-storage");
    this.storageKey = arg.storageKey;
    this.daysBetweenUpdates = arg.daysBetweenUpdates;
    this._initStorage();
  }

  // Returns the last update date
  UpdateTracker.prototype.getLastUpdatedAt = function() {
    return this._load();
  };

  // Reset the last update date to today
  UpdateTracker.prototype.setUpdated = function() {
    var today = new Date()
    this._save(today);
  };

  // Returns true if the time between updates has passed
  UpdateTracker.prototype.isOutdated = function() {
    var today = new Date();
    return this.getNextUpdateAt() < today;
  };

  // Calculate the date when the last update is outdated
  UpdateTracker.prototype.getNextUpdateAt = function() {
    var lastUpdateYear = this.getLastUpdatedAt().getFullYear();
    var lastUpdateMonth = this.getLastUpdatedAt().getMonth();
    var lastUpdateDate = this.getLastUpdatedAt().getDate();
    return new Date(lastUpdateYear, lastUpdateMonth, lastUpdateDate + this.daysBetweenUpdates);
  };

  // Set the last updated date to epoch when it doesn't exist yet
  UpdateTracker.prototype._initStorage = function() {
    if (!this._hasStorageKey()) {
      var epoch = new Date(0);
      this._save(epoch);
    }
  };

  // Save the date as a timestamp in the SimpleStorage container
  UpdateTracker.prototype._save = function(date) {
    this.ss.storage[this.storageKey] = date.getTime();
  };

  // Read the last updated timestamp from the SimpleStorage container and convert to a date
  UpdateTracker.prototype._load = function() {
    return new Date(this.ss.storage[this.storageKey]);
  };

  // Returns true if the storage key is set
  UpdateTracker.prototype._hasStorageKey = function() {
    return !!this.ss.storage[this.storageKey];
  };

  return UpdateTracker;

})();

exports.updateTracker = UpdateTracker;
