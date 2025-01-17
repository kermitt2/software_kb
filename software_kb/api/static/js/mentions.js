(function ($) {
    $.fn.facetview = function(options) {

        var url_options = $.getUrlVars();
        var entity_id = url_options.id;
        var entity_type = url_options.type;
        if (!entity_type)
            entity_type = 'software'

        // async function
        async function fetchAsync(url) {
            // await response of fetch call
            let response = await fetch(url);
            let data = await response.json();
            return data;
        }

        async function getJsonFile(url) {
            let response = await fetch(url);
            let responsejson = await response.json();
            let str = JSON.stringify(responsejson);
            let jsonData = JSON.parse(str);
            return jsonData;
        };

        async function getJsonFileWithData(url, data) {
            let response = await fetch(
                url, { 
                    method: "POST", 
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json"
                    },
                    body: data 
                }
            );
            let responsejson = await response.json();
            let str = JSON.stringify(responsejson);
            let jsonData = JSON.parse(str);
            return jsonData;
        };

        var showEntityMetadata = function(id) {
            // get json object for the entity
            getJsonFile(options.kb_service_host + "/entities/"+entity_type+"/"+id).then(softwareJson => {
                record = softwareJson["record"];

                metadata = '<div class="panel" style="margin-bottom:20!important; background-color:#ffffff; border: 1px;">';
                metadata += '<div style="padding: 20px;">'
                metadata += '<p><strong>' +
                            '<a target="_blank" href="' + 
                            options.kb_service_host + '/frontend/entity.html?id=' + id + '&type=' + entity_type + '">' + 
                            record["labels"] + '</a></strong>';
                if (record["descriptions"]) {
                    metadata += " - " + record["descriptions"] 
                }

                metadata += ' <a target="_blank" style="color:#999999;" href="' + 
                            options.kb_service_host + "/entities/"+entity_type+"/" + id +'"><i class="fa fa-file"></i></a>'

                metadata += "</p>"
                if (record["summary"]) {
                    var localHtml = wiki2html(record["summary"], "en");
                    metadata += localHtml;
                }
                
                metadata += "</div></div>"
                $("#software-info").append(metadata);
            });
        }

        var metaTmpl = ' \
              <nav> \
                <ul class="pager"> \
                  <li class="previous" style="position: absolute; left:100px;"><a id="facetview_decrement" style="color:#d42c2c;" href="{{from}}">&laquo; back</a></li> \
                  <li class="active"><a style="color:#d42c2c;">{{from}} &ndash; {{to}} of {{total}}</a></li> \
                  <li class="next" style="position: absolute; right:100px;"><a id="facetview_increment" style="color:#d42c2c;" href="{{to}}">next &raquo;</a></li> \
                </ul> \
              </nav> \
              ';

        var displayDocument = function(rank, document_id) {
            getJsonFile(options.kb_service_host + "/entities/" + document_id).then(documentJson => {
                var publication = documentJson["record"]

                var localPublicationData = '<div class="row" style="margin-left: 20px; margin-right:20px; padding:10px;">' 

                localPublicationData += '<table style="width: 100%"><tr><td>'

                localPublicationData += "<i>" + publication["metadata"]["title"][0] + "</i>";
                if (publication["metadata"]["author"] && publication["metadata"]["author"].length > 0) {
                    var firstAuthor = publication["metadata"]["author"][0];
                    localPublicationData += ", " + publication["metadata"]["author"][0]["family"] + ' et al.'
                }

                if (publication["metadata"]["container-title"] && publication["metadata"]["container-title"].length > 0) {
                    localPublicationData += ", " + publication["metadata"]["container-title"][0];
                }

                if (publication["metadata"]["DOI"])
                    localPublicationData += ', DOI: <a target="_blank" href="https://doi.org/' +  
                        publication["metadata"]["DOI"] + '">' + publication["metadata"]["DOI"] + '</a>';

                if (publication["metadata"]["pmid"])
                    localPublicationData += ', PMID: <a target="_blank" href="https://pubmed.ncbi.nlm.nih.gov/' + 
                        publication["metadata"]["pmid"]  + '/">' + publication["metadata"]["pmid"] + '</a>';

                if (publication["metadata"]["pmcid"])
                    localPublicationData += ', PMC ID: <a target="_blank" href="https://www.ncbi.nlm.nih.gov/pmc/articles/' + 
                    publication["metadata"]["pmcid"] + '">' + publication["metadata"]["pmcid"] + '</a>';

                localPublicationData += ' <a target="_blank" style="color:#999999;" href="' + 
                    options.kb_service_host + "/entities/" + document_id +'"><i class="fa fa-file"></i></a>';

                localPublicationData += '</td><td>&nbsp;&nbsp;</td><td style="width: 150px; border-style: solid; border-width: 1px; background-color: #EEEEEE; border-color: #EEEEEE;">' +
                    '<a target="_blank" href="' + 
                        options.kb_service_host + '/frontend/document.html?id=' + document_id.replace("documents/","") + 
                        '"><table style="width: 100%;"><tr><td style="text-align:center;">'+
                        '<table style="width: 100%;"><tr><td style="text-align:center;">View mentions</td></tr><td>in PDF</td></tr></table>'+
                        '</td><td><img width="30px" src="data/images/view.png"/>'+
                        '</td></tr></table></a></td></tr></table>';

                localPublicationData += "</div>";

                $("#document-"+rank).empty();
                $("#document-"+rank).append(localPublicationData);
            });
        }

        var displayResult = function(theRank, document_record) {

            const rank = theRank;
            const mention_records = document_record["mentions"]
            var localDocumentData = '<div class="row" id="document-' + rank + '"></div>';
            $("#mention-"+rank).empty();
            $("#mention-"+rank).append(localDocumentData);
            var bestTwo = '<div id="best-two-' + rank + '"></div>';
            $("#mention-"+rank).append(bestTwo);

            const document_id = document_record["document_id"];
            const nb_mentions_in_document = mention_records.length            

            var string = "";
            if (nb_mentions_in_document>2) {
                string += "<div class='panel-group' id='accordionParentStatements"+ rank +"'>";
                string += "<div class='panel panel-default'>";
                string += "<div class='panel-heading' style='background-color:#FFF;color:#70695C;border:padding:0px;font-size:small;'>";
                // accordion-toggle collapsed: put the chevron icon down when starting the page; accordion-toggle : put the chevron icon up
                string += "<a class='accordion-toggle collapsed' data-toggle='collapse' data-parent='#accordionParentStatements"+ rank +"' href='#collapseElementMentions"+ rank + "' style='outline:0;'>";
                string += "<h5 class='panel-title' style='font-weight:normal; font-size:13px'>show other " + (nb_mentions_in_document-2) + " mentions</h5>";
                string += "</a>";
                string += "</div>";
                // panel-collapse collapse: hide the content of statemes when starting the page; panel-collapse collapse in: show it
                string += "<div id='collapseElementMentions"+ rank +"' class='panel-collapse collapse'>";
                string += "</div></div></div>";
                $("#mention-"+rank).append(string);
            }
            
            for(var mention_record in mention_records) {
                const pos_record = mention_record;
                var mention_id = mention_records[pos_record];

                getJsonFile(options.kb_service_host + "/relations/" + mention_id).then(mentionJson => {
                    var mention = mentionJson["record"]

                    localMentionData = '<div class="row" style="margin-left: 20px; margin-right:20px; background-color: #EEEEEE; border: 1px; padding:5px;">' 

                    if (mention["claims"]["P7081"] && mention["claims"]["P7081"].length > 0 && mention["claims"]["P7081"][0]["value"]) {
                        var snippet = mention["claims"]["P7081"][0]["value"]

                        // annotations: a qualifier must be present (it means a bounding box exists for 
                        //the label and the label is indeed in the snippet)

                        pos = 0;
                        var software_name;
                        if (mention["claims"]["P6166"] && mention["claims"]["P6166"].length > 0 
                            && mention["claims"]["P6166"][0]["value"]
                            && mention["claims"]["P6166"][0]["qualifiers"]) {
                            // software name
                            var annotation = mention["claims"]["P6166"][0]["value"];
                            var offset = snippet.indexOf(annotation);
                            if (offset != -1) {
                                const label = "person";
                                const tag_prefix = '<span rel="popover" data-color="' + label + '">'
                                                    + '<span class="label ' + label + '" style="cursor:hand;cursor:pointer;" >';
                                const tag_suffix = '</span></span>';
                                snippet = snippet.substring(0, offset)
                                + tag_prefix
                                + snippet.substring(offset, offset + annotation.length)
                                + tag_suffix
                                + snippet.substring(offset + annotation.length, snippet.length);
                                pos = offset + tag_prefix.length + annotation.length + tag_suffix.length
                            }
                            software_name = annotation;
                        }
                        if (mention["claims"]["P348"] && mention["claims"]["P348"].length > 0 
                            && mention["claims"]["P348"][0]["value"]
                            && mention["claims"]["P348"][0]["qualifiers"]) {
                            // version
                            var annotation = mention["claims"]["P348"][0]["value"];
                            var offset = snippet.indexOf(annotation, pos);
                            if (offset != -1) {
                                const label = "national"
                                snippet = snippet.substring(0, offset)
                                + '<span rel="popover" data-color="' + label + '">'
                                + '<span class="label ' + label + '" style="cursor:hand;cursor:pointer;" >'
                                +  snippet.substring(offset, offset + annotation.length)
                                + '</span></span>'
                                + snippet.substring(offset + annotation.length, snippet.length);
                            }
                        }
                        if (mention["claims"]["P123"] && mention["claims"]["P123"].length > 0 
                            && mention["claims"]["P123"][0]["value"]
                            && mention["claims"]["P123"][0]["qualifiers"]) {
                            // publisher
                            var annotation = mention["claims"]["P123"][0]["value"];
                            var offset = -1;
                            if (annotation === software_name)
                                offset = snippet.indexOf(annotation, pos);
                            else
                                offset = snippet.indexOf(annotation);
                            if (offset != -1) {
                                const label = "administration"
                                snippet = snippet.substring(0, offset)
                                + '<span rel="popover" data-color="' + label + '">'
                                + '<span class="label ' + label + '" style="cursor:hand;cursor:pointer;" >'
                                +  snippet.substring(offset, offset + annotation.length)
                                + '</span></span>'
                                + snippet.substring(offset + annotation.length, snippet.length);
                            }
                        }
                        if (mention["claims"]["P854"] && mention["claims"]["P6166"].length > 0 
                            && mention["claims"]["P854"][0]["value"]
                            && mention["claims"]["P854"][0]["qualifiers"]) {
                            // url
                            var annotation = mention["claims"]["P854"][0]["value"];
                            var offset = snippet.indexOf(annotation);
                            if (offset != -1) {
                                const label = "biology"
                                snippet = snippet.substring(0, offset)
                                + '<span rel="popover" data-color="' + label + '">'
                                + '<span class="label ' + label + '" style="cursor:hand;cursor:pointer;" >'
                                +  snippet.substring(offset, offset + annotation.length)
                                + '</span></span>'
                                + snippet.substring(offset + annotation.length, snippet.length);
                            }
                        }

                        localMentionData += '<p>' + snippet + 
                            ' <a target="_blank" style="color:#999999;" href="' + 
                                options.kb_service_host + "/relations/" + mention_id +'"><i class="fa fa-file"></i></a>'
                            + '</p>';
                    }

                    localMentionData += '</div><div class="row" style="margin-left: 20px; margin-right:20px; background-color: #FFFFFF; border: 1px; padding:5px;"></div>'
                    if (pos_record >= 2)
                        $("#collapseElementMentions"+ rank).append(localMentionData);
                    else {
                        $("#best-two-"+rank).append(localMentionData);
                    } 
                });
            }
            displayDocument(rank, document_id);
        }

        var displaySoftware = function(theRank, record) {

            const rank = theRank;
            var localSoftwareData = '<div class="row" id="software-info-' + rank + '"></div>';
            $("#software-"+rank).empty();
            $("#software-"+rank).append(localSoftwareData);

            const local_es_query_json = 
                '{ "_source": false, "fields": ["labels", "descriptions", "number_mentions", "number_documents"], '+
                '"query": { "terms": { "_id": [ "' + record["_id"].replace("software/","") + '" ] } } }';
            const get_es_url = options.kb_service_host + "/search/software-kb/_search";
            getJsonFileWithData(get_es_url, local_es_query_json).then(responseJson => {
                if (responseJson && responseJson['hits'] && responseJson['hits']['hits'] && responseJson['hits']['hits'].length == 1) {
                    const es_entity_fields = responseJson['hits']['hits'][0]['fields']

                    var softwareData = '<div style="padding-left: 20px;"><table width="100%"><tr><td width="60%">';

                    softwareData += "<p><strong>";
                    softwareData += '<a target="_blank" href="' + 
                        options.kb_service_host  + '/frontend/entity.html?type=software&id=' + record["_id"].replace("software/","") + '" >' +
                       es_entity_fields["labels"]+"</a></strong> - " + es_entity_fields["descriptions"] + "</p>";
                    
                    softwareData += "<p><b>roles:</b> ";
                    for (var rolePos in record["roles"]) {
                        if (rolePos != 0)
                            softwareData += ", ";
                        softwareData += record["roles"][rolePos]['codemeta'];
                    }
                    softwareData += "</p></td><td>&nbsp;&nbsp;</td><td>";

                    var localMentionData = '<a target="_blank" href="mentions.html?id=' + record["_id"].replace("software/","") + '&type=software">';
                    localMentionData += es_entity_fields['number_mentions'] + ' mentions in ' + es_entity_fields['number_documents'] + ' documents';
                    localMentionData += "</a>";
                    localMentionData += ' <span style="color:#999999;">(click to view mentions)</span>';
                    
                    softwareData += localMentionData + "</td></tr></table>";

                    softwareData += "</div>";
                    
                    $("#software-info-"+rank).append(softwareData);                    
                }
            });
        }

        // get json object for software
        var showEntityMentions = function(id) {
            
            // get json object for software
            if (entity_type === 'software') {
                getJsonFile(options.kb_service_host + "/entities/"+entity_type+"/"+id+
                    "/mentions?page_rank=" + options.paging.rank + "&page_size=" + 
                    options.paging.size + "&ranker=group_by_document").then(mentionsJson => {
                    records = mentionsJson["records"];

                    nbDocuments = mentionsJson["full_count"]
                    from = mentionsJson["page_rank"]*mentionsJson["page_size"]
                    to = from + records.length

                    var from = options.paging.rank * options.paging.size;
                    var size = options.paging.size;
                    !size ? size = 10 : "";
                    var to = from + size;
                    nbDocuments< to ? to = nbDocuments : "";

                    var meta = metaTmpl.replace(/{{from}}/g, from);
                    meta = meta.replace(/{{to}}/g, to);
                    meta = meta.replace(/{{total}}/g, addCommas("" + nbDocuments));
                    $('#facetview_metadata').html("").append(meta);
                    $('#facetview_decrement').bind('click', decrement);
                    from < size ? $('#facetview_decrement').html('..') : "";
                    $('#facetview_increment').bind('click', increment);
                    nbDocuments <= to ? $('#facetview_increment').html('..') : "";

                    documentData = ""
                    if (nbDocuments == 0) {
                        documentData += '<div class="panel" style="margin-bottom:20!important; background-color:#ffffff; border: 1px;">';
                        documentData += '<div style="padding: 20px;">'
                        documentData += '<div class="row" style="text-align: center;">no mention</div>'
                        documentData += "</div></div>"
                    } else {
                        //console.log(records)
                        for (var record in records) {
                            //console.log(records[record])
                            documentData += '<div class="panel" style="margin-bottom:20!important; background-color:#ffffff; border: 1px;">';
                            documentData += '<div style="padding: 20px;" id="mention-' + record + '">'
                            documentData += "</div></div>";
                        }
                    }

                    documentData += "</div></div>"
                    $("#mentions-content").empty();
                    $("#mentions-content").append(documentData);

                    if (nbDocuments > 0) {
                        for (var record in records) {
                            displayResult(record, records[record]);
                        }
                    }
                });
            } else if (entity_type === 'persons') {
                getJsonFile(options.kb_service_host + "/entities/"+entity_type+"/"+id+
                    "/software?page_rank=" + options.paging.rank + "&page_size=" + 
                    options.paging.size).then(mentionsJson => {
                    records = mentionsJson["records"];

                    nbDocuments = mentionsJson["full_count"]
                    from = mentionsJson["page_rank"]*mentionsJson["page_size"]
                    to = from + records.length

                    var from = options.paging.rank * options.paging.size;
                    var size = options.paging.size;
                    !size ? size = 10 : "";
                    var to = from + size;
                    nbDocuments< to ? to = nbDocuments : "";

                    var meta = metaTmpl.replace(/{{from}}/g, from);
                    meta = meta.replace(/{{to}}/g, to);
                    meta = meta.replace(/{{total}}/g, addCommas("" + nbDocuments));
                    $('#facetview_metadata').html("").append(meta);
                    $('#facetview_decrement').bind('click', decrement);
                    from < size ? $('#facetview_decrement').html('..') : "";
                    $('#facetview_increment').bind('click', increment);
                    nbDocuments <= to ? $('#facetview_increment').html('..') : "";

                    documentData = ""
                    if (nbDocuments == 0) {
                        documentData += '<div class="panel" style="margin-bottom:20!important; background-color:#ffffff; border: 1px;">';
                        documentData += '<div style="padding: 20px;">'
                        documentData += '<div class="row" style="text-align: center;">no software</div>'
                        documentData += "</div></div>"
                    } else {
                        //console.log(records)
                        for (var record in records) {
                            //console.log(records[record])
                            documentData += '<div class="panel" style="margin-bottom:20!important; background-color:#ffffff; border: 1px;">';
                            documentData += '<div style="padding: 20px;" id="software-' + record + '">'
                            documentData += "</div></div>";
                        }
                    }

                    documentData += "</div></div>"
                    $("#mentions-content").empty();
                    $("#mentions-content").append(documentData);

                    if (nbDocuments > 0) {
                        for (var record in records) {
                            displaySoftware(record, records[record]);
                        }
                    }
                });
            }
        }

        var decrement = function (event) {
            event.preventDefault();
            if ($(this).html() != '..') {
                options.paging.rank = options.paging.rank - 1;
                options.paging.rank < 0 ? options.paging.rank = 0 : "";
                showEntityMentions(entity_id);
            }
        };

        // increment result set
        var increment = function (event) {
            event.preventDefault();
            if ($(this).html() != '..') {
                options.paging.rank = options.paging.rank + 1;
                showEntityMentions(entity_id);
            }
        };

        options.paging.rank = 0;
        options.paging.size = 10;

        showEntityMetadata(entity_id);
        $("#facetview_metadata").append(
                '<div class="row" style="width: 100%; padding:10px; text-align: center;">' +
                '<p style="color:#BC0E0E;">fetching mentions...</p></div>'
        );
        showEntityMentions(entity_id);
    }

})(jQuery);