Global / onChangedBuildSource := ReloadOnSourceChanges

ThisBuild / version := "0.1.0-SNAPSHOT"

ThisBuild / scalaVersion := "3.7.2"

lazy val root = (project in file("."))
  .settings(
    name := "simpleset-backend",
    libraryDependencies ++= Seq(
      "dev.zio" %% "zio" % "2.1.22",
      "dev.zio" %% "zio-http" % "3.5.1",
      "dev.zio" %% "zio-json" % "0.7.45",
      "dev.zio" %% "zio-schema" % "1.7.5",
      "dev.zio" %% "zio-schema-derivation" % "1.7.5",
      "dev.zio" %% "zio-schema-json" % "1.7.5",
      "dev.zio" %% "zio-test" % "2.1.22" % Test,
      "dev.zio" %% "zio-test-sbt" % "2.1.22" % Test
    ),
    testFrameworks += new TestFramework("zio.test.sbt.ZTestFramework")
  )
