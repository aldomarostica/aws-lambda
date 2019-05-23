const elasticsearch = require('elasticsearch');

module.exports = {
    sleep: (milliseconds) => {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    },
    createIndex : async (client,indexName) => {
        await client.indices.create({
            'index': indexName,
            'body' : {
              'settings' : {
                  'number_of_shards' : 3,
                  'number_of_replicas' : 0,
                  'analysis' : {
                        'filter' : {
                            'split_underscore' : {
                                'type' : 'pattern_capture',
                                'preserve_original' : true,
                                'patterns' : [
                                    '([^_\.]+)'
                                ]
                            },
                            'split_comma' : {
                                'type' : 'pattern_capture',
                                'preserve_original' : true,
                                'patterns' : [
                                    '([^,\.]+)'
                                ]
                            },
                            'stop_file_ext' : {
                                'type' : 'stop',
                                'stopwords' : ['tif', 'mov', 'mp4']
                            }
                        },
                        'normalizer' : {
                            'to_lowercase' : {
                                'type' : 'custom',
                                'filter' : ['lowercase']
                            }
                        },
                        'tokenizer' : {
                            'comma_separated' : {
                                'type' : 'pattern',
                                'pattern' : ','
                            }    
                        },
                        'analyzer' : {
                            'underscore_split_analyzer' : {
                                'tokenizer' : 'pattern',
                                'filter' : [
                                    'split_underscore',
                                    'lowercase', 
                                    'stop_file_ext',
                                    'trim'
                                ]
                            },
                            'whitespace_analyzer' : {
                                'tokenizer' : 'whitespace',
                                'filter' : [
                                    'split_underscore',
                                    'split_comma',
                                    'lowercase', 
                                    'stop_file_ext',
                                    'trim'
                                ]
                            },
                            'comma_split_analyzer' : {
                                'tokenizer' : 'pattern',
                                'filter' : [
                                    'split_comma',
                                    'lowercase',
                                    'stop_file_ext',
                                    'trim'
                                ]
                            },
                            'comma_separated_analyzer' : {
                                'tokenizer' : 'comma_separated',
                                'filter' : [
                                    'lowercase'
                                ]
                            }
                        }
                    }
                }
            }
        });
  
        await client.indices.putMapping({
            'index' : indexName,
            'type' : 'asset',
            'body' : {
              'asset' : {
                '_source' : {
                    'enabled' : true
                },
                'properties' : {
                    'products' : {
                        'type' : 'nested',
                        'properties' : {
                            'id' : {
                                'type' : 'keyword'
                            },
                            'season' : {
                                'type' : 'keyword',
                                'normalizer' : 'to_lowercase',
                                'copy_to': [ 'full_text' ]
                            },
                            'segmentation' : {
                                'type' : 'keyword',
                                'normalizer' : 'to_lowercase',
                                'copy_to': [ 'full_text' ]
                            },
                            'collection' : {
                                'type' : 'keyword',
                                'normalizer' : 'to_lowercase',
                                'copy_to': [ 'full_text' ]
                            },
                            'item_code' : {
                                'type' : 'keyword',
                                'normalizer' : 'to_lowercase',
                                'copy_to': [ 'full_text' ]
                            },
                            'product_name' : {
                                'type' : 'keyword',
                                'normalizer' : 'to_lowercase',
                                'copy_to': [ 'full_text' ]
                            },
                            'color' : {
                                'type' : 'keyword',
                                'normalizer' : 'to_lowercase',
                                'copy_to': [ 'full_text' ]
                            },
                            'color_code' : {
                                'type' : 'keyword',
                                'normalizer' : 'to_lowercase',
                                'copy_to': [ 'full_text' ]
                            },
                            'sku' : {
                                'type' : 'keyword',
                                'normalizer' : 'to_lowercase',
                                'copy_to': [ 'full_text' ]
                            },
                            'product_type' : {
                                'type' : 'keyword',
                                'normalizer' : 'to_lowercase',
                                'copy_to': [ 'full_text' ]
                            },
                            'eastpak_source' : {
                                'type' : 'keyword',
                                'normalizer' : 'to_lowercase',
                                'copy_to': [ 'full_text' ]
                            },
                            'ean_code' : {
                                'type' : 'keyword',
                                'normalizer' : 'to_lowercase',
                                'copy_to': [ 'full_text' ]
                            }
                        }
                    },
                    'full_text' : {
                        'type' : 'text',
                        'fielddata' : true,
                        'analyzer' : 'whitespace_analyzer',
                        'search_analyzer' : 'standard',
                        'fields' : {
                            'raw' : {
                                'type' : 'keyword'
                            }
                       },
                       "store" : true
                    },
                    'submodule_id' : {
                        'type' : 'keyword'
                    },
                    'additional_seasons' : {
                        'type' : 'text',
                        'fielddata' : true,
                        'search_analyzer' : 'standard',
                        'analyzer' : 'comma_separated_analyzer',
                        'copy_to': [ 'full_text' ]
                        //'normalizer' => 'to_lowercase',
                    },
                    'Use' : {
                        'type' : 'text',
                        'fielddata' : true,
                        'search_analyzer' : 'standard',
                        'analyzer' : 'comma_separated_analyzer',
                        'copy_to': [ 'full_text' ]
                    },
                    'type_of_content' : {
                        'type' : 'keyword',
                        'normalizer' : 'to_lowercase',
                        'copy_to': [ 'full_text' ]
                    },
                    'campaign_type' : {
                        'type' : 'keyword',
                        'normalizer' : 'to_lowercase',
                        'copy_to': [ 'full_text' ]
                    },
                    'project' : {
                            'type' : 'keyword',
                            'normalizer' : 'to_lowercase',
                            'copy_to': [ 'full_text' ]
                    },
                    'project_name' : {
                            'type' : 'keyword',
                            'normalizer' : 'to_lowercase',
                            'copy_to': [ 'full_text' ]
                    },
                    'file_name' : {
                        'type' : 'text',
                        'analyzer' : 'underscore_split_analyzer',
                        'search_analyzer' : 'standard',
                        'fields' : {
                            'raw' : {
                                'type' : 'keyword'
                            }
                       },
                       'copy_to': [ 'full_text' ]
                    },
                    'CDN_Thumb' : {
                        'type' : 'text',
                        'analyzer' : 'underscore_split_analyzer',
                        'search_analyzer' : 'standard',
                        'fields' : {
                            'raw' : {
                                'type' : 'keyword'
                            }
                       }
                    },
                    'CDN_mLow' : {
                        'type' : 'text',
                        'analyzer' : 'underscore_split_analyzer',
                        'search_analyzer' : 'standard',
                        'fields' : {
                            'raw' : {
                                'type' : 'keyword'
                            }
                       }
                    },
                    'CDN_mMid' : {
                        'type' : 'text',
                        'analyzer' : 'underscore_split_analyzer',
                        'search_analyzer' : 'standard',
                        'fields' : {
                            'raw' : {
                                'type' : 'keyword'
                            }
                       }
                    },
                    'CDN_mHigh' : {
                        'type' : 'text',
                        'analyzer' : 'underscore_split_analyzer',
                        'search_analyzer' : 'standard',
                        'fields' : {
                            'raw' : {
                                'type' : 'keyword'
                            }
                       }
                    },
                    'keywords' : {
                            'type' : 'text',
                            'fielddata' : true,
                            'search_analyzer' : 'standard',
                            'analyzer' : 'comma_split_analyzer'
                    },
                    'asset_type' : {
                            'type' : 'keyword',
                            'normalizer' : 'to_lowercase'
                    },
                    'ls_asset_type' : {
                            'type' : 'keyword',
                            'normalizer' : 'to_lowercase'
                    },
                    'event' : {
                            'type' : 'keyword',
                            'normalizer' : 'to_lowercase'
                    },
                    'sales_type' : {
                            'type' : 'keyword',
                            'normalizer' : 'to_lowercase',
                            'copy_to': [ 'full_text' ]
                    },
                    'segmentation' : {
                        'type' : 'keyword',
                        'normalizer' : 'to_lowercase',
                    },
                    'colour_code' : {
                        'type' : 'keyword',
                        'normalizer' : 'to_lowercase',
                    },
                    'collection' : {
                        'type' : 'keyword',
                        'normalizer' : 'to_lowercase',
                    },
                    'color_name' : {
                        'type' : 'keyword',
                        'normalizer' : 'to_lowercase',
                    },
                    'drop_date' : {
                        'type' : 'text',
                        'fielddata' : true,
                        'search_analyzer' : 'standard',
                        'analyzer' : 'comma_separated_analyzer',
                        'copy_to': [ 'full_text' ]
                        //'normalizer' => 'to_lowercase',
                    }
                }
              }
            }
        });
    },
    deleteIndex : async (client,indexName) => {
        await client.deleteByQuery({
          index: indexName,
          q: '*'
        });
        /*await client.indices.delete({
            index: indexName,
            }, function(err, res) {
            
            if (err) {
                console.error(err.message);
            } else {
                console.log('Indexes have been deleted!');
            }
        });*/
    },
    arrayRemove: (arr, prop) => {

        const newArr = Object.keys(arr).reduce((object, key) => {
          if (key !== prop) {
            object[key] = arr[key]
          }
          return object
        }, {})
        
        return newArr;

    }
}