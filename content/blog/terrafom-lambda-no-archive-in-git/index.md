---
title: "Deploy AWS Lambda with Terraform without storing the Zip archive"
description: "Terraform is a great tool but managing AWS Lambda is arguably not one of its strength. In this post I'll describe one approach that I follow to work around this limitation."
tags:
  - terraform
  - serverless
  - lambda
date: "2021-09-18"
---

[Terraform by _HashiCorp_][1] is a powerful (and probably underrated) OpenSource tool well known to every software engineer that has to manage some kind of workload in _the cloud_. Actually I don't think it's an overstatement to say it's already since a while the standard _de-facto_ when talking about cloud-agnostic Infrastructure as Code (_IaC_).

As for every tool though there are places where they shine and others where they do less so and managing _AWS Lambda Functions_ is arguably falling in the second category, at least from my experience and judging on popular blog posts with titles like ["Deploying AWS Lambda functions with Terraform: Just Don't"][2], or simply witnessing [the number of different blog entries][3] and various articles on this very topic.

## The problem

The canonical way of defining an [`aws_lambda_function` resource][5] is shown in the [official HashiCorp tutorial][4], with this being the most relevant piece of configuration:

```hcl
data "archive_file" "lambda_hello_world" {
  type = "zip"

  source_dir  = "${path.module}/hello-world"
  output_path = "${path.module}/hello-world.zip"
}

resource "aws_s3_bucket_object" "lambda_hello_world" {
  bucket = aws_s3_bucket.lambda_bucket.id

  key    = "hello-world.zip"
  source = data.archive_file.lambda_hello_world.output_path

  etag = filemd5(data.archive_file.lambda_hello_world.output_path)
}

resource "aws_lambda_function" "hello_world" {
  function_name = "HelloWorld"

  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key    = aws_s3_bucket_object.lambda_hello_world.key

  runtime = "nodejs12.x"
  handler = "hello.handler"

  source_code_hash = data.archive_file.lambda_hello_world.output_base64sha256

  role = aws_iam_role.lambda_exec.arn
}
```

As you might notice there's a catch: the above configuration expects a `hello-world.zip` binary archive to be actually available on the filesystem where the `terraform` process is actually being executed. This is conflicting with the common desire of not storing any binary blob into your version control system.

The above problem might be mitigated in a single-user environment with something like (if you're using Git) adding `*.zip` in the module's `.gitignore` file but definitely falls short in a multi user environment: it wastes precious resources and bloats the repositories while giving essential zero benefits in return being the Zip archive a mere technicality of the AWS Lambda [`create_function` API][6] that doesn't contain anything not already present elsewhere in the source code.

## The solution

The process that I've been following to successfully deploy a new Lambda version in a shared (that is, multi-user) Terraform environment requires four steps:

1. edit the Lambda source code
1. build a new binary (Zip) archive
1. apply Terraform
1. commit and push local configuration changes

which means one more step (step __#2__) compared to the general approach.

The main idea is borrowed by [the aforementioned blog post][2], i.e. to leverage `openssl` binary (which I assume is available on every developer workstation, regardless of its architecture) and generate up-to-date MD5/SHA hashes of the archive in the #2 step, then store these into our repository in step #4.

One downside is that we don't have the archive content anymore but, being stored in S3, we can assume it's available, globally accessible and durable by definition. We can also enable versioning for the `lambda_hello_world` S3 bucket and have all the history available too if needed.

You can find a working example of the solution on GitHub: <https://github.com/shaftoe/terraform-aws-lambda-example>

## Conclusion

In this article I've shared my take on how to manage AWS Lambda resources in a multi-user Terraform environment without the need of storing the Zip archive.

It's essentially a tread off between simplicity (fewer possible steps in the release process) and efficiency (fewer binary blobs stored in version control) that I devised out of frustration with the canonical approach and other solutions that I've read about.

It has been working well for the last few months and I thought it worth sharing. As usual please leave your comments in the form below.

Happy Infra-as-Coding 🎉

[1]: <https://www.terraform.io/>
[2]: <https://johnroach.io/2020/09/04/deploying-lambda-functions-with-terraform-just-dont>
[3]: <https://duckduckgo.com/?q=how+to+aws+lambda+terraform>
[4]: <https://learn.hashicorp.com/tutorials/terraform/lambda-api-gateway>
[5]: <https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_function>
[6]: <https://docs.aws.amazon.com/lambda/latest/dg/API_CreateFunction.html>