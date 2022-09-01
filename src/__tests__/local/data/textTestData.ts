export const exampleFigmaObjectIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

export const exampleFigmaObject: any = {
  id: exampleFigmaObjectIds[0],
  children: [
    {
      id: exampleFigmaObjectIds[1],
      name: 'hidden',
      children: [
        {
          id: exampleFigmaObjectIds[2],
        },
        {
          id: exampleFigmaObjectIds[3],
          children: [
            {
              id: exampleFigmaObjectIds[4],
            },
          ],
        },
      ],
    },
    {
      id: exampleFigmaObjectIds[5],
    },
    {
      id: exampleFigmaObjectIds[6],
      children: [
        {
          id: exampleFigmaObjectIds[7],
          children: [
            {
              id: exampleFigmaObjectIds[9],
              name: 'hidden',
              children: [
                {
                  id: exampleFigmaObjectIds[8],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
