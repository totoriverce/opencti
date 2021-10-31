import { assetSingularizeSchema as singularizeSchema } from '../asset-mappings.js';
import { getSparqlQuery, getReducer } from './sparql-query.js';
import { compareValues } from '../../utils.js';

const networkResolvers = {
  Query: {
    networkAssetList: async ( _, args, context, info ) => {
      var sparqlQuery = getSparqlQuery('NETWORK', );
      var reducer = getReducer('NETWORK')
      const response = await context.dataSources.Stardog.queryAll( 
        context.dbName, 
        sparqlQuery,
        singularizeSchema,
        // args.first,       // limit
        // args.offset,      // offset
        args.filter );    // filter
      if (Array.isArray(response) && response.length > 0) {
        // build array of edges
        const edges = [];
        let limit = (args.first === undefined ? response.length : args.first) ;
        let offset = (args.offset === undefined ? 0 : args.offset) ;
        let assetList ;
        if (args.orderedBy !== undefined ) {
          assetList = response.sort(compareValues(args.orderedBy, args.orderMode ));
        } else {
          assetList = response;
        }
        for (let asset of assetList) {
          // skip down past the offset
          if ( offset ) {
            offset--
            continue
          }

          if ( limit ) {
            let edge = {
              cursor: asset.iri,
              node: reducer( asset ),
            }
            edges.push( edge )
            limit--;
          }
        }
        return {
          pageInfo: {
            startCursor: assetList[0].iri,
            endCursor: assetList[assetList.length -1 ].iri,
            hasNextPage: (args.first > assetList.length ? true : false),
            hasPreviousPage: (args.offset > 0 ? true : false),
            globalCount: assetList.length,
          },
          edges: edges,
        }
      } else {
        return ;
      }
    },
    networkAsset: async (_, args, context, info ) => {
      var sparqlQuery = getSparqlQuery('NETWORK', args.id, );
      var reducer = getReducer('NETWORK')
      const response = await context.dataSources.Stardog.queryById( 
        context.dbName, 
        sparqlQuery, 
        singularizeSchema 
      )
      console.log( response[0] );
      return( reducer( response[0]) );
      // return( networkAssetReducer( response[0]) );
    }
  },
  Mutation: {
    createNetworkAsset: ( parent, args, context, info ) => {
    },
    deleteNetworkAsset: ( parent, args, context, info ) => {
    },
    editNetworkAsset: ( parent, args, context, info ) => {
    },
  },
  // Map enum GraphQL values to data model required values
  NetworkAsset: {
    network_address_range: async (parent, args, context,  ) => {
      let item = parent.netaddr_range_iri;
      var sparqlQuery = getSparqlQuery('NETADDR-RANGE', item);
      var reducer = getReducer('NETADDR-RANGE');
      const response = await context.dataSources.Stardog.queryById( 
        context.dbName, 
        sparqlQuery, 
        singularizeSchema 
      )
      if (response && response.length > 0) {
        // console.log( response[0] );
        // let results = ipAddrRangeReducer( response[0] )    TODO: revert when data is passed as objects, instead of string
        let results = reducer( response[0] )
        return {
          id: results.id,
          starting_ip_address: {
            id: "1243",
            ...(results.entity_type && {entity_type: results.entity_type}),
            ip_address_value: results.start_addr_iri
          },
          ending_ip_address: {
            id: "4556",
            ...(results.entity_type && {entity_type: results.entity_type}),
            ip_address_value: results.ending_addr_iri
          }
        }
        return results
      }
    }
  }
};

export default networkResolvers;