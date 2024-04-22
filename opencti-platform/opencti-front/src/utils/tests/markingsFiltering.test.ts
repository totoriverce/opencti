import {describe, expect, it} from "vitest";
import {Option} from "@components/common/form/ReferenceField";

function filterMarkingsOutFor(selectedOptions: {
  label: any;
  value: any;
  color?: any;
  definition_type?: any;
  x_opencti_order?: any;
  entity: any;
}[], markingsOptions: {
  label: string;
  value: string;
  color: string;
  definition_type: string;
  x_opencti_order: number;
  entity: {
    id: string;
    entity_type: string;
    standard_id: string;
    definition_type: string;
    definition: string;
    x_opencti_color: string;
    x_opencti_order: number;
  };
}[]) {
  return markingsOptions.filter(
    ({entity}) =>
      selectedOptions.some(selectedOption =>
        entity.definition_type === selectedOption.entity.definition_type
        && entity.x_opencti_order <= selectedOption.entity.x_opencti_order
      )
      || selectedOptions.every(selectedOption => selectedOption.entity !== entity.definition_type)
  )
}

const markingsOptions = [
  {
    label: "PAP:CLEAR",
    value: "7f4d0215-1dc0-470d-af27-dad09eb71c29",
    color: "#ffffff",
    definition_type: "PAP",
    x_opencti_order: 1,
    entity: {
      id: "7f4d0215-1dc0-470d-af27-dad09eb71c29",
      entity_type: "Marking-Definition",
      standard_id: "marking-definition--4cdff7eb-acb8-543f-8573-829eb9fe8b34",
      definition_type: "PAP",
      definition: "PAP:CLEAR",
      x_opencti_color: "#ffffff",
      x_opencti_order: 1
    }
  },
  {
    label: "PAP:GREEN",
    value: "b2c4c787-5aea-4995-b4b9-589fc9722890",
    color: "#2e7d32",
    definition_type: "PAP",
    x_opencti_order: 2,
    entity: {
      id: "b2c4c787-5aea-4995-b4b9-589fc9722890",
      entity_type: "Marking-Definition",
      standard_id: "marking-definition--89484dde-e3d2-547f-a6c6-d14824429eb1",
      definition_type: "PAP",
      definition: "PAP:GREEN",
      x_opencti_color: "#2e7d32",
      x_opencti_order: 2
    }
  },
  {
    label: "PAP:AMBER",
    value: "63256ea9-f565-48eb-a0d5-4bed950fa68f",
    color: "#d84315",
    definition_type: "PAP",
    x_opencti_order: 3,
    entity: {
      id: "63256ea9-f565-48eb-a0d5-4bed950fa68f",
      entity_type: "Marking-Definition",
      standard_id: "marking-definition--a6f20d4d-0360-59b6-ba22-3b48707828b1",
      definition_type: "PAP",
      definition: "PAP:AMBER",
      x_opencti_color: "#d84315",
      x_opencti_order: 3
    }
  },
  {
    label: "PAP:RED",
    value: "51504300-0e2e-41aa-924a-b8729e2beead",
    color: "#c62828",
    definition_type: "PAP",
    x_opencti_order: 4,
    entity: {
      id: "51504300-0e2e-41aa-924a-b8729e2beead",
      entity_type: "Marking-Definition",
      standard_id: "marking-definition--4e4e3b84-de45-53df-9d9b-b21207699fd8",
      definition_type: "PAP",
      definition: "PAP:RED",
      x_opencti_color: "#c62828",
      x_opencti_order: 4
    }
  },
  {
    label: "TLP:CLEAR",
    value: "d2799e1f-2f63-4934-a8f9-ee82e90f5ef3",
    color: "#ffffff",
    definition_type: "TLP",
    x_opencti_order: 1,
    entity: {
      id: "d2799e1f-2f63-4934-a8f9-ee82e90f5ef3",
      entity_type: "Marking-Definition",
      standard_id: "marking-definition--613f2e26-407d-48c7-9eca-b8e91df99dc9",
      definition_type: "TLP",
      definition: "TLP:CLEAR",
      x_opencti_color: "#ffffff",
      x_opencti_order: 1
    }
  },
  {
    label: "TLP:GREEN",
    value: "22f33608-71e5-4582-b642-07ebeae8f853",
    color: "#2e7d32",
    definition_type: "TLP",
    x_opencti_order: 2,
    entity: {
      id: "22f33608-71e5-4582-b642-07ebeae8f853",
      entity_type: "Marking-Definition",
      standard_id: "marking-definition--34098fce-860f-48ae-8e50-ebd3cc5e41da",
      definition_type: "TLP",
      definition: "TLP:GREEN",
      x_opencti_color: "#2e7d32",
      x_opencti_order: 2
    }
  },
  {
    label: "TLP:AMBER+STRICT",
    value: "e8429416-5fc5-445e-aac9-56c063e2388a",
    color: "#d84315",
    definition_type: "TLP",
    x_opencti_order: 3,
    entity: {
      id: "e8429416-5fc5-445e-aac9-56c063e2388a",
      entity_type: "Marking-Definition",
      standard_id: "marking-definition--826578e1-40ad-459f-bc73-ede076f81f37",
      definition_type: "TLP",
      definition: "TLP:AMBER+STRICT",
      x_opencti_color: "#d84315",
      x_opencti_order: 3
    }
  },
  {
    label: "TLP:AMBER",
    value: "110f255b-8549-4cbb-b12d-0fa462e8a8e7",
    color: "#d84315",
    definition_type: "TLP",
    x_opencti_order: 3,
    entity: {
      id: "110f255b-8549-4cbb-b12d-0fa462e8a8e7",
      entity_type: "Marking-Definition",
      standard_id: "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
      definition_type: "TLP",
      definition: "TLP:AMBER",
      x_opencti_color: "#d84315",
      x_opencti_order: 3
    }
  },
  {
    label: "TLP:RED",
    value: "b70c4a3f-28f3-43bf-b3e3-1e20a02cde53",
    color: "#c62828",
    definition_type: "TLP",
    x_opencti_order: 4,
    entity: {
      id: "b70c4a3f-28f3-43bf-b3e3-1e20a02cde53",
      entity_type: "Marking-Definition",
      standard_id: "marking-definition--5e57c739-391a-4eb3-b6be-7d15ca92d5ed",
      definition_type: "TLP",
      definition: "TLP:RED",
      x_opencti_color: "#c62828",
      x_opencti_order: 4
    }
  }
]

describe('Markings filtering', () => {
  describe('On single marking selection', () => {

    it('should filter markings list based on lowest marking selection', () => {
      const expectedFilteredMarkingsOptions = [...markingsOptions]
      const filteredMarkingsOutForPapClear = filterMarkingsOutFor([{
        label: "PAP:CLEAR",
        value: "7f4d0215-1dc0-470d-af27-dad09eb71c29",
        color: "#ffffff",
        definition_type: "PAP",
        x_opencti_order: 1,
        entity: {
          id: "7f4d0215-1dc0-470d-af27-dad09eb71c29",
          entity_type: "Marking-Definition",
          standard_id: "marking-definition--4cdff7eb-acb8-543f-8573-829eb9fe8b34",
          definition_type: "PAP",
          definition: "PAP:CLEAR",
          x_opencti_color: "#ffffff",
          x_opencti_order: 1
        }
      }], markingsOptions);
      expect(filteredMarkingsOutForPapClear).toStrictEqual(expectedFilteredMarkingsOptions)
    })

    it('should filter markings list based on highest marking selection', () => {
      const expectedFilteredMarkingsOptions = [...markingsOptions]
      const filteredMarkingsOutForPapClear = filterMarkingsOutFor([
        {
          label: "PAP:CLEAR",
          value: "7f4d0215-1dc0-470d-af27-dad09eb71c29",
          color: "#ffffff",
          definition_type: "PAP",
          x_opencti_order: 1,
          entity: {
            id: "7f4d0215-1dc0-470d-af27-dad09eb71c29",
            entity_type: "Marking-Definition",
            standard_id: "marking-definition--4cdff7eb-acb8-543f-8573-829eb9fe8b34",
            definition_type: "PAP",
            definition: "PAP:CLEAR",
            x_opencti_color: "#ffffff",
            x_opencti_order: 1
          }
        },
        {
          label: "PAP:GREEN",
          value: "b2c4c787-5aea-4995-b4b9-589fc9722890",
          color: "#2e7d32",
          definition_type: "PAP",
          x_opencti_order: 2,
          entity: {
            id: "b2c4c787-5aea-4995-b4b9-589fc9722890",
            entity_type: "Marking-Definition",
            standard_id: "marking-definition--89484dde-e3d2-547f-a6c6-d14824429eb1",
            definition_type: "PAP",
            definition: "PAP:GREEN",
            x_opencti_color: "#2e7d32",
            x_opencti_order: 2
          }
        },
        {
          label: "PAP:AMBER",
          value: "63256ea9-f565-48eb-a0d5-4bed950fa68f",
          color: "#d84315",
          definition_type: "PAP",
          x_opencti_order: 3,
          entity: {
            id: "63256ea9-f565-48eb-a0d5-4bed950fa68f",
            entity_type: "Marking-Definition",
            standard_id: "marking-definition--a6f20d4d-0360-59b6-ba22-3b48707828b1",
            definition_type: "PAP",
            definition: "PAP:AMBER",
            x_opencti_color: "#d84315",
            x_opencti_order: 3
          }
        },
      ], markingsOptions);
      expect(filteredMarkingsOutForPapClear).toStrictEqual(expectedFilteredMarkingsOptions)
    })
  })
})