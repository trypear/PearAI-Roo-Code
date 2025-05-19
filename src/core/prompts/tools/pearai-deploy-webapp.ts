import { ToolArgs } from "./types"

export function getPearaiDeployWebappDescription(args: ToolArgs): string {
	return `<tool_description>
<tool_name>pearai_deploy_webapp</tool_name>
<description>
Deploy a web application to Netlify. This tool can be used for both new deployments and redeployments.
</description>
<parameters>
<parameter>
<name>zip_file_path</name>
<type>string</type>
<description>Absoulute path to the zip file containing the web application files</description>
<required>true</required>
</parameter>
<parameter>
<name>env_file_path</name>
<type>string</type>
<description>Absoulute path to the environment file containing deployment configuration</description>
<required>true</required>
</parameter>
<parameter>
<name>site_id</name>
<type>string</type>
<description>Optional site ID for redeploying an existing site. If not provided, a new site will be created.</description>
<required>false</required>
</parameter>
<parameter>
<name>isStatic</name>
<type>boolean</type>
<description>Whether this is a static site deployment (true) or a server-side rendered site (false)</description>
<required>true</required>
</parameter>
</parameters>
<usage>
To deploy a new web application:
<example>
<tool>pearai_deploy_webapp</tool>
<parameter name="zip_file_path">/path/to/app.zip</parameter>
<parameter name="env_file_path">/path/to/.env</parameter>
<parameter name="isStatic">true</parameter>
</example>

To redeploy an existing site:
<example>
<tool>pearai_deploy_webapp</tool>
<parameter name="zip_file_path">/path/to/app.zip</parameter>
<parameter name="env_file_path">/path/to/.env</parameter>
<parameter name="site_id">your-site-id</parameter>
<parameter name="isStatic">true</parameter>
</example>
</usage>
</tool_description>`
} 