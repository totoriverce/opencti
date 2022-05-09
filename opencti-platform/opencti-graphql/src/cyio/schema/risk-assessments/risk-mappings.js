export const riskSingularizeSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "created": true,
    "modified": true,
    // Common
    "abstract": true,
    "administrative_area": true,
    "address_type": true,
    "author": true,
    "authors": false,
    "city": true,
    "color": true,
    "content": true,
    "country_code": true,
    "description": true,
    "external_id": true,
    "label_name": true,
    "last_modified": true,
    "last_scanned": true,
    "locations": false,
    "media_type": true,
    "name": true,
    "phone_number": true,
    "phone_number_type": true,
    "postal_code": true,
    "published": true,
    "reference_purpose": true,
    "release_date": true,
    "responsible_parties": false,
    "source_name": true,
    "start_date": true,
    "street_address": true,
    "uri": false,
    "url": true,
    "usage_type": true,
    "valid_from": true,
    "valid_until": true,
    "version": true,
    // Asset
    "asset_id": true,
    "asset_tag": true,
    "asset_type": true,
    "baseline_configuration_name": true,
    "bios_id": true,
    "connected_to_network": true,
    "cpe_identifier": true,
    "default_gateway": true,
    "ending_ip_address": true,
    "fqdn": true,
    "hostname": true,
    "implementation_point": true,
    "installation_id": true,
    "installed_hardware": false,
    "installed_operating_system": false,  // should be true
    "installed_os_name": true,           // true
    "installed_software": false,
    "ip_address": false,
    "ip_address_value": true,
    "is_publicly_accessible": true,
    "is_scanned": true,
    "is_virtual": true,
    "license_key": true,
    "mac_address": false,
    "mac_address_value": true,
    "model": true,
    "motherboard_id": true,
    "netbios_name": true,
    "network_address_range": true,
    "network_id": true,
    "network_name": true,
    "operational_status": true,
    "patch_level": true,
    "port_number": true,
    "ports": false,
    "serial_number": true,
    "service_software": true,
    "software_identifier": true,
    "starting_ip_address": true,
    "system_name": true,
    "vendor_name": true,
    "vlan_id": true,
    // OSCAL
    "accepted": true,
    "accepted_risk": true,
    "access_complexity": true,
    "access_vector": true,
    "actor_type": true,
    "actor_ref": true,
    "attack_complexity": true,
    "attack_vector": true,
    "authentication": true,
    "availability_impact_2": true,
    "availability_impact_3": true,
    "availability_requirement": true,
    "base_score": true,
    "collateral_damage_potential": true,
    "collected": true,
    "component_type": true,
    "confidentiality_impact_2": true,
    "confidentiality_impact_3": true,
    "confidentiality_requirement": true,
    "cvss20_base_score": true,
    "cvss20_environmental_score": true,
    "cvss20_temporal_score": true,
    "cvss20_vector_string": true,
    "cvss30_base_score": true,
    "cvss30_environmental_score": true,
    "cvss30_temporal_score": true,
    "cvss30_vector_string": true,
    "deadline": true,
    "encoded_content": true,
    "end_date": true,
    "ending_port": true,
    "entry_type": false,
    "event_end": true,
    "event_start": true,
    "expires": true,
    "exploitability": true,
    "exploit_available": true,
    "exploit_code_maturity": true,
    "facet_name": true,
    "facet_value": true,
    "false_positive": true,
    "filename": true,
    "frequency_period": true,
    "hash_algorithm": true,
    "hash_value": true,
    "href": true,
    "identifier": true,
    "impact": true,
    "implementation_status": true,
    "include_all": true,
    "inherited_uuid": true,
    "integrity_impact_2": true,
    "integrity_impact_3": true,
    "integrity_requirement": true,
    "job_title": true,
    "mail_stop": true,
    "office": true,
    "on_date": true,
    "party_type": true,
    "short_name": true,
    "label_text": true,
    "leveraged_authorization_uuid": true,
    "lifecycle": true,
    "likelihood": true,
    "location_class": true,
    "location_type": true,
    "modified_attack_complexity": true,
    "modified_attack_vector": true,
    "modified_availability_impact": true,
    "modified_confidentiality_impact": true,
    "modified_integrity_impact": true,
    "modified_privileges_required": true,
    "modified_scope": true,
    "modified_user_interaction": true,
    "objective_status_explanation": true,
    "objective_status_reason": true,
    "objective_status_state": true,
    "operational_requirement": true,
    "oscal_version": true,
    "plugin_family": true,
    "plugin_file": true,
    "plugin_id": true,
    "plugin_name": true,
    "plugin_type": true,
    "poam_id": true,
    "priority": true,
    "privileges_required": true,
    "purpose": true,
    "privilege_level": true,
    "remediation_level": true,
    "report_confidence_2": true,
    "report_confidence_3": true,
    "resource_type": true,
    "response_type": true,
    "risk": true,
    "risk_adjusted": true,
    "risk_state": true,
    "risk_status": true,
    "role_identifier": true,
    "role_ref": true,
    "scheme": true,
    "scope": true,
    "score_rationale": true,
    "severity": true,
    "source_system": true,
    "ssp_ref": true,
    "starting_port": true,
    "statement": true,
    "status_change": true,
    "subject_context": true,
    "subject_name": true,
    "subject_type": true,
    "subject_version": true,
    "system_id": true,
    "system_identifier_type": true,
    "target": true,
    "target_distribution": true,
    "target_type": true,
    "task_type": true,
    "temporal_score": true,
    "time_unit": true,
    "timing": true,
    "user_interaction": true,
    "user_type": true,
    "vector_string": true,
    "vendor_dependency": true,
    "vulnerability_id": true,
    // dynamic risk data
    "cvssV2Base_score": true,
    "cvssV2Temporal_score": true,
    "cvssV3Base_score": true,
    "cvssV3Temporal_score": true,
    "remediation_lifecycle_values": true,
    "remediation_type_values": true,
    "occurrences": true,
  }
};

export const riskTypeMapping = {
  // object-type: GraphQL-Type
  "activity": "Activity",
  "actor": "Actor",
  "assessment-log-entry": "AssessmentLogEntry",
  "assessment-platform": "AssessmentPlatform",
  "assessment-subject": "AssessmentSubject",
  "associated-activity": "AssociatedActivity",
  "characterization": "Characterization",
  "component": "Component",
  "evidence": "Evidence",
  "facet": "Facet",
  "finding-target": "FindingTarget",
  "inventory-item": "InventoryItem",
  "mitigating-factor": "MitigatingFactor",
  "observation": "Observation",
  "origin": "Origin",
  "oscal-location": "OscalLocation",
  "oscal-party": "OscalParty",
  "oscal-relationship": "OscalRelationship",
  "oscal-role": "OscalRole",
  "oscal-resource": "OscalResource",
  "oscal-responsible-party": "OscalResponsibleParty",
  "oscal-revision": "Revision",
  "oscal-task": "OscalTask",
  "oscal-user": "OscalUser",
  "poam": "POAM",
  "poam-item": "POAMItem",
  "poam-local-definition": "POAMLocalDefinition",
  "required-asset": "RequiredAsset",
  "risk": "Risk",
  "risk-response": "RiskResponse",
  "risk-log-entry": "RiskLogEntry",
  "subject": "Subject",
};


