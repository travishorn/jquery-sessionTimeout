<%
'' The user will never see this page.
'' It's only used to keep the user's session alive.

Session("keepAlive") = Now()
%>