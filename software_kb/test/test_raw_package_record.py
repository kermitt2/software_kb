import os
import json
import sys

from software_kb.importing.cran_import import _convert_raw_package_record, convert_reference_information 

# CRAN package metadata page

sample_html = "resources/CRAN_Package_knitr.html"
if not os.path.exists(sample_html):
    sample_html = "test/resources/CRAN_Package_knitr.html"
if not os.path.exists(sample_html):
    sample_html = "software_kb/test/resources/CRAN_Package_knitr.html"

with open(sample_html) as file:
    content_html = file.read()

package_json = {}
package_json['Package'] = "knitr"
package_json = _convert_raw_package_record(content_html, package_json)

print(package_json)

sample_html = "resources/CRAN_Package_aaSEA.html"
if not os.path.exists(sample_html):
    sample_html = "test/resources/CRAN_Package_aaSEA.html"
if not os.path.exists(sample_html):
    sample_html = "software_kb/test/resources/CRAN_Package_aaSEA.html"

with open(sample_html) as file:
    content_html = file.read()

package_json = {}
package_json['Package'] = "aaSEA"
package_json = _convert_raw_package_record(content_html, package_json)

print(package_json)

sample_html = "resources/CRAN_Package_reportROC.html"
if not os.path.exists(sample_html):
    sample_html = "test/resources/CRAN_Package_reportROC.html"
if not os.path.exists(sample_html):
    sample_html = "software_kb/test/resources/CRAN_Package_reportROC.html"

with open(sample_html) as file:
    content_html = file.read()

package_json = {}
package_json['Package'] = "reportROC"
package_json = _convert_raw_package_record(content_html, package_json)

print(package_json)


# CRAN raw reference info

sample_html = "resources/knitr_citation.html"
if not os.path.exists(sample_html):
    sample_html = "test/resources/knitr_citation.html"
if not os.path.exists(sample_html):
    sample_html = "software_kb/test/resources/knitr_citation.html"    

with open(sample_html) as file:
    content_html = file.read()

ref_json = {}
ref_json = convert_reference_information(content_html)

print(ref_json)
