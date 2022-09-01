export const textKeys: Record<string, string> = {
  firstTextKey: 'firstcontent',
  secondTextKey: 'secondContent',
}

export default {
  document: {
    id: '0:0',
    name: 'Document',
    type: 'DOCUMENT',
    children: [
      {
        id: '48:16015',
        name: '---💳 CARD 💳 ---',
        type: 'CANVAS',
        children: [],
        backgroundColor: { r: 0.8980392217636108, g: 0.8980392217636108, b: 0.8980392217636108, a: 1 },
        prototypeStartNodeID: null,
        flowStartingPoints: [],
        prototypeDevice: { type: 'NONE', rotation: 'NONE' },
      },
      {
        id: '5425:86274',
        name: 'Export',
        type: 'CANVAS',
        children: [
          {
            id: '5425:86277',
            name: 'VariantDesktop',
            type: 'FRAME',
            blendMode: 'PASS_THROUGH',
            children: [
              {
                id: '5425:108575',
                name: 'FuncNow',
                type: 'FRAME',
                blendMode: 'PASS_THROUGH',
                children: [
                  {
                    id: '5425:108576',
                    name: 'Group 9479',
                    type: 'GROUP',
                    blendMode: 'PASS_THROUGH',
                    children: [
                      {
                        id: '5425:108577',
                        name: 'sideMenuuu 1',
                        type: 'RECTANGLE',
                        blendMode: 'PASS_THROUGH',
                        absoluteBoundingBox: { x: 5805, y: -16973, width: 287, height: 1024 },
                        absoluteRenderBounds: { x: 5805, y: -16973, width: 287, height: 1024 },
                        preserveRatio: true,
                        constraints: { vertical: 'TOP', horizontal: 'LEFT' },
                        fills: [
                          {
                            blendMode: 'NORMAL',
                            type: 'IMAGE',
                            scaleMode: 'FILL',
                            imageRef: '1de9b544eba0ca63f880495b96101d7c8208f136',
                          },
                        ],
                        strokes: [],
                        strokeWeight: 1,
                        strokeAlign: 'INSIDE',
                        effects: [],
                      },
                      {
                        id: '5425:108578',
                        name: 'dash',
                        type: 'FRAME',
                        blendMode: 'PASS_THROUGH',
                        children: [
                          {
                            id: '5425:108579',
                            name: Object.keys(textKeys)[0],
                            characters: Object.values(textKeys)[0],
                            type: 'TEXT',
                            blendMode: 'PASS_THROUGH',
                            absoluteBoundingBox: { x: 6217, y: -16909, width: 238, height: 35 },
                            absoluteRenderBounds: {
                              x: 6219.240234375,
                              y: -16902.439453125,
                              width: 233.52392578125,
                              height: 31.119140625,
                            },
                            constraints: { vertical: 'TOP', horizontal: 'LEFT' },
                            fills: [
                              {
                                blendMode: 'NORMAL',
                                type: 'SOLID',
                                color: { r: 0.10588235408067703, g: 0.10980392247438431, b: 0.12156862765550613, a: 1 },
                              },
                            ],
                            strokes: [],
                            strokeWeight: 1,
                            strokeAlign: 'OUTSIDE',
                            styles: { fill: '151:24147' },
                            style: {
                              fontFamily: 'Manrope',
                              fontSize: 16,
                              fontWeight: 500,
                              letterSpacing: 0.3,
                              lineHeight: 22.4,
                            },
                          },
                          {
                            id: '5425:108839',
                            name: Object.keys(textKeys)[1],
                            characters: Object.values(textKeys)[1],
                            type: 'TEXT',
                            blendMode: 'PASS_THROUGH',
                            absoluteBoundingBox: { x: 6217, y: -16909, width: 238, height: 35 },
                            absoluteRenderBounds: {
                              x: 6219.240234375,
                              y: -16902.439453125,
                              width: 233.52392578125,
                              height: 31.119140625,
                            },
                            constraints: { vertical: 'TOP', horizontal: 'LEFT' },
                            fills: [
                              {
                                blendMode: 'NORMAL',
                                type: 'SOLID',
                                color: { r: 0.10588235408067703, g: 0.10980392247438431, b: 0.12156862765550613, a: 1 },
                              },
                            ],
                            strokes: [],
                            strokeWeight: 1,
                            strokeAlign: 'OUTSIDE',
                            styles: { fill: '151:24147' },
                            style: {
                              fontFamily: 'Manrope',
                              fontSize: 16,
                              fontWeight: 500,
                              letterSpacing: 0.3,
                              lineHeight: 22.4,
                            },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
}
