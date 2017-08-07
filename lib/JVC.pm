package JVC;

use v5.12;
use strict;
use warnings;

use Carp qw(cluck);
use LWP;
use LWP::UserAgent;
use JSON;

sub new {
	my ($class, %opts) = @_;

	my $self = {
		cfg => {
			host => $opts{host},
			user => $opts{user} // 'jvc',
			pass => $opts{pass} // '0000'
		},
		session => $opts{session}
	};

	return bless $self, $class;
}

sub request {
	my ($self, $method, $endpoint, $data) = @_;

	if (not defined $self->{ua}) {
		$self->{ua} = LWP::UserAgent->new;
		$self->{ua}->cookie_jar({});
		$self->{ua}->credentials(
			$self->{cfg}{host} . ":80",
			"GY-HM200",
			$self->{cfg}{user},
			$self->{cfg}{pass}
		);
		$self->{ua}->requests_redirectable([]);
	}

	my $req = HTTP::Request->new($method => "http://" . $self->{cfg}{host} . $endpoint);
	$req->content_type('application/x-www-form-urlencoded');
	$req->content($data) if defined $data;

	return $self->{ua}->request($req);
}

sub ensure_login {
	my ($self, $force) = @_;

	return 1 if($self->{session} and not defined $force);

	my $res = $self->request(GET => "/login.php");
	if (!$res->is_redirect) {
		cluck "expected redirect in response to login";
		return 0;
	}

	my $target = $res->header("Location");
	if ($target ne 'index.php') {
		cluck "login failed ($target). login lock taken?";
		return 0;
	}

	$self->{session} = $self->{ua}->cookie_jar->get_cookies($self->{cfg}{host}, "PHPSESSID");

	return 1;
}

sub cmd {
	my ($self, $cmd, $param) = @_;
	my $restarted = 0;

restart:
	return unless $self->ensure_login;

	my $obj;
	$obj->{Request}{Command} = $cmd;
	$obj->{Request}{SessionID} = $self->{session};
	if ($param) {
		$obj->{Request}{Params} = $param;
	}

	my $res = $self->request(POST => "/cgi-bin/cmd.cgi", to_json($obj, {canonical => 1}));
	if (!$res->is_success) {
		cluck "command request failed: " . $res->status_line;
	}

	my $json = from_json($res->decoded_content);
	if (!$json or not $json->{Response}) {
		cluck "got invalid json: " . $res->decoded_content;
	}

	if ($json->{Response}{Result} eq 'SessionError') {
		undef $self->{session};
		if (not $restarted) {
			$restarted = 1;
			goto restart;
		} else {
			cluck "got SessionError repeatedly, aborting";
			return;
		}
	}

	if ($json->{Response}{Result} ne 'Success') {
		cluck "command $cmd failed: " . $json->{Response}{Result};
		return;
	}

	return $json->{Response}{Data};
}

sub get_status {
	my ($self) = @_;

	return $self->cmd("GetCamStatus");
}

1;
