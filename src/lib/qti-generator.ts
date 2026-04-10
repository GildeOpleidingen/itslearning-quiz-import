import JSZip from "jszip";
import type { CorrectAnswer, CsvRow } from "./csv-parser";

const WRONG_PENALTY = "-0.33333333333333331";
const CHOICE_MAP: Record<CorrectAnswer, string> = {
  A: "A0",
  B: "A1",
  C: "A2",
  D: "A3",
};
const ALL_CHOICES = ["A0", "A1", "A2", "A3"];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function generateItemXml(itemId: number, row: CsvRow): string {
  const correctId = CHOICE_MAP[row.juist];
  const options = [row.antwoordA, row.antwoordB, row.antwoordC, row.antwoordD];

  // Build mapping: correct first, then wrong in A0-A3 order
  let mapEntries = `        <mapEntry mapKey="${correctId}" mappedValue="1" />`;
  for (const cid of ALL_CHOICES) {
    if (cid !== correctId) {
      mapEntries += `        <mapEntry mapKey="${cid}" mappedValue="${WRONG_PENALTY}" />`;
    }
  }

  // Build choices
  let choices = "";
  for (let i = 0; i < ALL_CHOICES.length; i++) {
    const cid = ALL_CHOICES[i]!;
    const escaped = escapeHtml(options[i]!);
    choices +=
      `        <simpleChoice fixed="false" showHide="show" identifier="${cid}">` +
      `          <div class="htmlContent"><![CDATA[<p>${escaped}</p>  ]]></div>` +
      `        </simpleChoice>`;
  }

  const escapedQ = escapeHtml(row.vraag);

  return (
    '<?xml version="1.0" encoding="utf-8"?>' +
    "<assessmentItem " +
    'xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 ' +
    "http://www.imsglobal.org/xsd/qti/qtiv2p1/qtiv2p1_imscpv1p2_v1p0.xsd " +
    "http://www.imsglobal.org/xsd/imsqti_v2p1 " +
    'http://www.imsglobal.org/xsd/qti/qtiv2p1/imsqti_v2p1p2.xsd" ' +
    `identifier="item${itemId}" title="MultipleChoice" ` +
    'adaptive="false" timeDependent="false" ' +
    'toolName="itslearning" toolVersion="3.122" ' +
    'xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1" ' +
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
    'xmlns:qti="http://www.imsglobal.org/xsd/imsqti_v2p1">' +
    '<responseDeclaration cardinality="single" baseType="identifier" identifier="RESPONSE">' +
    `<correctResponse><value>${correctId}</value></correctResponse>` +
    `<mapping lowerBound="-1" upperBound="1" defaultValue="0">${mapEntries}      </mapping>` +
    "</responseDeclaration>" +
    '<outcomeDeclaration cardinality="single" baseType="identifier" identifier="FEEDBACK" ' +
    'view="" normalMaximum="0" normalMinimum="0" masteryValue="0" />' +
    '<outcomeDeclaration cardinality="single" baseType="identifier" identifier="INTEGRATEDFEEDBACK" ' +
    'view="" normalMaximum="0" normalMinimum="0" masteryValue="0" />' +
    "<itemBody>" +
    `      <div class="htmlContent"><![CDATA[<p><strong>${escapedQ}</strong></p>]]></div>` +
    '      <choiceInteraction responseIdentifier="RESPONSE" shuffle="false" maxChoices="1" minChoices="0">' +
    choices +
    "      </choiceInteraction>" +
    "    </itemBody>" +
    "</assessmentItem>"
  );
}

function generateManifestXml(itemIds: number[]): string {
  const manifestId = crypto.randomUUID();
  const year = new Date().getFullYear();

  let resources = "";
  for (const iid of itemIds) {
    resources +=
      `<resource identifier="resource-item-${iid}" type="imsqti_item_xmlv2p1" href="item${iid}.xml">` +
      "<metadata>" +
      '<lom xmlns="http://ltsc.ieee.org/xsd/LOM">' +
      '<general><title><string xml:lang="en">MultipleChoice</string></title></general>' +
      "<technical><format>text/x-imsqti-item-xml</format></technical>" +
      '<qtiMetadata xmlns="http://www.imsglobal.org/xsd/imsqti_metadata_v2p1">' +
      "<interactionType>choiceInteraction</interactionType>" +
      "</qtiMetadata>" +
      "</lom>" +
      "</metadata>" +
      `<file href="item${iid}.xml" />` +
      "</resource>";
  }

  return (
    '<?xml version="1.0" encoding="utf-8"?>' +
    `<manifest identifier="MANIFEST-${manifestId}" ` +
    'xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 ' +
    "http://www.imsglobal.org/xsd/qti/qtiv2p1/qtiv2p1_imscpv1p2_v1p0.xsd" +
    "    http://ltsc.ieee.org/xsd/LOM " +
    "http://www.imsglobal.org/xsd/imsmd_loose_v1p3p2.xsd" +
    "    http://www.imsglobal.org/xsd/imsqti_metadata_v2p1 " +
    'http://www.imsglobal.org/xsd/qti/qtiv2p1/imsqti_metadata_v2p1p1.xsd" ' +
    'xmlns="http://www.imsglobal.org/xsd/imscp_v1p1" ' +
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
    "<metadata>" +
    "<schema>QTIv2.1 Package</schema>" +
    "<schemaversion>1.0.0</schemaversion>" +
    '<lom xmlns="http://ltsc.ieee.org/xsd/LOM">' +
    '<general><title><string xml:lang="en">Content package with QTI v2.1 items</string></title></general>' +
    "<technical><format>text/x-imsqti-item-xml</format></technical>" +
    "<rights><description>" +
    `<string xml:lang="en">Copyright (c) ${year} itslearning - All rights reserved, https://itslearning.com</string>` +
    "</description></rights>" +
    "</lom>" +
    "</metadata>" +
    "<organizations />" +
    `<resources>${resources}</resources>` +
    "</manifest>"
  );
}

export async function generateQtiZip(rows: CsvRow[]): Promise<Blob> {
  const zip = new JSZip();

  const itemIds: number[] = [];
  for (let i = 0; i < rows.length; i++) {
    const itemId = i + 1;
    itemIds.push(itemId);
    zip.file(`item${itemId}.xml`, generateItemXml(itemId, rows[i]!));
  }

  zip.file("imsmanifest.xml", generateManifestXml(itemIds));

  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}
