const { extensionForMediaMessage } = require("../lib/Utils/messages-media")

describe("extensionForMediaMessage", () => {
  test("extracts extension from mimetype with parameters", () => {
    const extension = extensionForMediaMessage({
      imageMessage: {
        mimetype: "image/jpeg; charset=utf-8"
      }
    })

    expect(extension).toBe("jpeg")
  })

  test("keeps location messages mapped to jpeg", () => {
    const extension = extensionForMediaMessage({
      locationMessage: {}
    })

    expect(extension).toBe(".jpeg")
  })

  test("falls back to bin when mimetype is not present", () => {
    const extension = extensionForMediaMessage({
      documentMessage: {
        mimetype: undefined
      }
    })

    expect(extension).toBe("bin")
  })
})
