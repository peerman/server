function ResourceModel(collection) {

	if(!(this instanceof ResourceModel)) {
		return new ResourceModel(collection);
	}

	this.create = function create(id, owner, metadata, callback) {

		metadata = metadata || {};

		collection.insert({
			_id: id,
			id: id, //used only for displaying purpose
			owner: owner, 
			metadata: metadata
		}, callback);
	};

	this.retrieve = function retrieve(id, callback) {
		
		var query = { _id: id };
		var options = {
			fields: { '_id': false }
		};
		collection.findOne(query, options, callback);
	};

	this.remove = function remove(id,callback) {

		collection.remove({_id: id}, callback);
	};

	this.setMetadata = function setMetadata(id, kvPairs, callback) {
		
		var query = {_id: id};
		var prefixedKvPairs = {};
		for(var key in kvPairs) {
			prefixedKvPairs['metadata.' + key] = kvPairs[key];
		}
		collection.update(query, { $set: prefixedKvPairs }, callback);
	};

	this.getMetadata = function getMetadata(id, keyList, callback) {

		var query = {_id: id};
		var options = {fields: listToPrefixedMap(keyList, 'metadata')};

		collection.findOne(query, options, function(err, resource) {

			if(err) {
				callback(err);
			} else if(resource) {
				callback(null, resource.metadata);
			} else {
				callback(new Error('NO_SUCH_RESOURCE'));
			}
		});
	};

	this.getAllMetadata = function getAllMetadata(id, callback) {

		var query = {_id: id};
		var options = {
			fields: { metadata: 1}
		};
		collection.findOne(query, options, function(err, resource) {

			if(err) {
				callback(err);
			} else if(resource) {
				callback(null, resource.metadata);
			} else {
				callback(new Error('NO_SUCH_RESOURCE'));
			}
		});
	};

	this.removeMetadata = function removeMetadata(id, keyList, callback) {
		
		var query = {_id: id};
		var updateObj = {
			$unset: listToPrefixedMap(keyList, 'metadata')
		};
		collection.update(query, updateObj, callback);
	};

	function listToPrefixedMap(list, prefix) {

		var map= {};
		for(var lc=0; lc<list.length; lc++) {
			map[prefix + '.' + list[lc]] = true;
		}

		return map;
	}
}

module.exports = ResourceModel;