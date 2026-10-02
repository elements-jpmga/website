// Minimal OCR CLI using Apple's Vision framework (offline, no dependencies).
// Usage: ocr <image-path>  → JSON lines: [{text, confidence, x, y, w, h}] (normalised, origin top-left)
import Foundation
import Vision
import AppKit

let args = CommandLine.arguments
guard args.count > 1, let img = NSImage(contentsOfFile: args[1]), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
  FileHandle.standardError.write("usage: ocr <image>\n".data(using: .utf8)!); exit(2)
}
let req = VNRecognizeTextRequest()
req.recognitionLevel = .accurate
req.usesLanguageCorrection = false
req.recognitionLanguages = ["en-US"]
let handler = VNImageRequestHandler(cgImage: cg, options: [:])
try handler.perform([req])
var out: [[String: Any]] = []
for o in req.results ?? [] {
  guard let c = o.topCandidates(1).first else { continue }
  let b = o.boundingBox // normalised, origin bottom-left
  out.append(["text": c.string, "confidence": Double(c.confidence), "x": b.origin.x, "y": 1 - b.origin.y - b.height, "w": b.width, "h": b.height])
}
let data = try JSONSerialization.data(withJSONObject: out, options: [])
FileHandle.standardOutput.write(data)
